"""AI-facing routes from the hackathon specification."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.database.supabase import supabase
from app.services.ai_service import (
    generate_ai_recommendation,
    generate_alternative_plan,
    generate_briefing,
    generate_shift_report,
    generate_simulation_insights,
)
from app.services.ai_payload import (
    build_ai_payload,
    normalize_consciousness,
    normalize_vitals,
)
from app.services.priority_engine import calculate_urgency
from app.services.resource_service import build_resources_summary, fetch_resources


router = APIRouter(tags=["AI operations"])


@router.post("/api/recommendations/generate")
def generate_recommendation(body: dict[str, Any]):
    """Generate a recommendation.

    The frontend sends only ``patientId``. The backend assembles patient,
    rule-engine, queue, and live resource context. A full context payload is
    also accepted for service-to-service use.
    """
    patient_id = body.get("patientId") or body.get("patient_id")
    context = body if body.get("patient") else _build_context(_require_patient_id(patient_id))
    recommendation = generate_ai_recommendation(context)
    patient_id = patient_id or context.get("patient", {}).get("patientId")
    recommendation_id = _save_recommendation(patient_id, recommendation)

    return _ok(
        {
            "recommendationId": recommendation_id,
            "patientId": patient_id,
            "status": "PENDING_VALIDATION",
            "recommendation": recommendation,
        }
    )


@router.post("/api/recommendations/{recommendation_id}/validate")
def validate_recommendation(recommendation_id: str):
    """Validate AI output against current database resources and hard rules."""
    audit = _get_recommendation(recommendation_id)
    recommendation = audit.get("recommendation") or {}
    errors: list[dict[str, str]] = []
    warnings: list[str] = []

    required = [
        "recommendedPriority",
        "recommendedQueuePosition",
        "recommendedUnit",
        "requiredEquipmentIds",
        "confidence",
        "requiresHumanApproval",
    ]
    for field in required:
        if field not in recommendation:
            errors.append({"code": "INVALID_STRUCTURE", "message": f"Missing {field}"})

    confidence = recommendation.get("confidence")
    if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
        errors.append(
            {"code": "INVALID_CONFIDENCE", "message": "Confidence must be between 0 and 1"}
        )
    if recommendation.get("requiresHumanApproval") is not True:
        errors.append(
            {
                "code": "HUMAN_APPROVAL_REQUIRED",
                "message": "AI recommendations cannot execute automatically",
            }
        )

    rows = fetch_resources()
    by_id = {str(row.get("id")): row for row in rows}
    _validate_resource(
        by_id,
        recommendation.get("recommendedBedId"),
        "bed",
        "BED",
        errors,
        warnings,
    )
    _validate_resource(
        by_id,
        recommendation.get("recommendedDoctorId"),
        "doctor",
        "DOCTOR",
        errors,
        warnings,
    )
    for equipment_id in recommendation.get("requiredEquipmentIds") or []:
        _validate_resource(
            by_id, equipment_id, "equipment", "EQUIPMENT", errors, warnings
        )

    valid_units = {
        _unit_name(row)
        for row in rows
        if row.get("resource_type") == "bed"
    } | {"Emergency Resuscitation", "Emergency", "Observation", "ICU"}
    if recommendation.get("recommendedUnit") not in valid_units:
        errors.append(
            {
                "code": "UNIT_INVALID",
                "message": f"Unit {recommendation.get('recommendedUnit')} does not exist",
            }
        )

    is_valid = not errors
    status = "AWAITING_HUMAN_APPROVAL" if is_valid else "VALIDATION_FAILED"
    _update_audit_status(recommendation_id, status)
    return _ok(
        {
            "recommendationId": recommendation_id,
            "isValid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "status": status,
        }
    )


@router.post("/api/recommendations/{recommendation_id}/alternative")
def alternative_recommendation(
    recommendation_id: str, body: dict[str, Any]
):
    """Generate one revised plan after validation failure."""
    audit = _get_recommendation(recommendation_id)
    patient_id = audit.get("patient_id")
    context = body.get("payload") or _build_context(_require_patient_id(patient_id))
    errors = body.get("validationErrors") or body.get("validation_errors") or []
    recommendation = generate_alternative_plan(context, errors)
    alternative_id = _save_recommendation(patient_id, recommendation, parent_id=recommendation_id)
    return _ok(
        {
            "recommendationId": alternative_id,
            "patientId": patient_id,
            "alternativePlan": recommendation,
            "status": "PENDING_VALIDATION",
        }
    )


@router.patch("/api/recommendations/{recommendation_id}/decision")
def recommendation_decision(recommendation_id: str, body: dict[str, Any]):
    """Apply a human approval, rejection, or override."""
    decision = str(
        body.get("decision") or body.get("action") or body.get("status") or ""
    ).upper()
    if decision not in {"APPROVED", "REJECTED", "OVERRIDDEN"}:
        raise HTTPException(
            status_code=422,
            detail="decision must be APPROVED, REJECTED, or OVERRIDDEN",
        )
    reviewed_by = body.get("reviewedBy") or body.get("reviewed_by")
    if not reviewed_by:
        raise HTTPException(status_code=422, detail="reviewedBy is required")

    audit = _get_recommendation(recommendation_id)
    patient_id = str(audit.get("patient_id"))
    recommendation = audit.get("recommendation") or {}
    allocation = body.get("overrideAllocation") or body.get("override_allocation") or {}
    if decision == "OVERRIDDEN":
        recommendation = {
            **recommendation,
            "recommendedUnit": allocation.get("unit"),
            "recommendedBedId": allocation.get("bedId"),
            "recommendedDoctorId": allocation.get("doctorId"),
            "requiredEquipmentIds": allocation.get("equipmentIds") or [],
        }

    allocated: dict[str, Any] = {}
    if decision in {"APPROVED", "OVERRIDDEN"}:
        allocated = _allocate_recommendation(patient_id, recommendation)
        supabase.table("patients").update(
            {
                "status": "assigned",
                "hospital_area": recommendation.get("recommendedUnit"),
                "assigned_bed_id": recommendation.get("recommendedBedId"),
                "assigned_doctor_id": recommendation.get("recommendedDoctorId"),
            }
        ).eq("id", patient_id).execute()
    else:
        supabase.table("patients").update({"status": "waiting"}).eq(
            "id", patient_id
        ).execute()

    decided_at = _now()
    try:
        supabase.table("audit_logs").update(
            {
                "status": decision,
                "recommendation": {
                    **recommendation,
                    "decision": decision,
                    "reviewedBy": reviewed_by,
                    "overrideReason": body.get("overrideReason"),
                },
            }
        ).eq("id", recommendation_id).execute()
    except Exception as exc:
        print(f"[ai_routes] Could not persist decision audit: {exc}")

    return _ok(
        {
            "recommendationId": recommendation_id,
            "decision": decision,
            "patientStatus": "ALLOCATED" if allocated else "WAITING",
            "allocatedResources": allocated,
            "approvedAt": decided_at if decision in {"APPROVED", "OVERRIDDEN"} else None,
        }
    )


@router.post("/api/ai/recommendation")
def frontend_recommendation(body: dict[str, Any]):
    """Return the existing frontend Recommendation shape using the same AI service."""
    patient_id = _require_patient_id(body.get("patientId") or body.get("patient_id"))
    context = _build_context(patient_id)
    result = generate_ai_recommendation(context)
    recommendation_id = _save_recommendation(patient_id, result)
    return _ok(_to_frontend_recommendation(recommendation_id, patient_id, result, context))


@router.post("/api/ai/simulate")
def simulate(body: dict[str, Any]):
    """Run a read-only operational simulation."""
    rows = _safe_resource_rows()
    snapshot = build_resources_summary(rows)
    return _ok(generate_simulation_insights(body, snapshot))


@router.post("/api/ai/briefing")
def briefing(body: dict[str, Any]):
    requested_by = str(body.get("requestedBy") or "Hospital Operator")
    rows = _safe_resource_rows()
    snapshot = build_resources_summary(rows)
    return _ok(generate_briefing(requested_by, snapshot, _active_alerts()))


@router.post("/api/ai/shift-report")
def shift_report(body: dict[str, Any]):
    shift_start = str(body.get("shiftStart") or "")
    shift_end = str(body.get("shiftEnd") or "")
    if not shift_start or not shift_end:
        raise HTTPException(status_code=422, detail="shiftStart and shiftEnd are required")
    snapshot = build_resources_summary(_safe_resource_rows())
    return _ok(
        generate_shift_report(
            shift_start,
            shift_end,
            snapshot,
            _pending_recommendations(),
            _active_alerts(),
        )
    )


def _build_context(patient_id: str) -> dict[str, Any]:
    patient_response = supabase.table("patients").select("*").eq("id", patient_id).execute()
    if not patient_response.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = patient_response.data[0]

    priority = {
        "score": patient.get("urgency_score") or patient.get("triage_score"),
        "level": patient.get("priority") or patient.get("priority_level"),
        "reasons": patient.get("triggered_rules") or [],
    }
    if not priority["score"] or priority["level"] not in {"P1", "P2", "P3", "P4"}:
        calculated = calculate_urgency(_priority_input(patient))
        priority = calculated
        try:
            supabase.table("patients").update(
                {
                    "urgency_score": calculated.get("score"),
                    "priority": calculated.get("level"),
                    "triggered_rules": calculated.get("reasons") or [],
                    "status": patient.get("status") or "WAITING",
                }
            ).eq("id", patient_id).execute()
        except Exception:
            pass

    rows = fetch_resources()
    queue_rows = _waiting_queue_rows(patient_id)
    return build_ai_payload(patient, priority, rows, queue_rows)


def _waiting_queue_rows(exclude_patient_id: str) -> list[dict[str, Any]]:
    try:
        response = (
            supabase.table("patients")
            .select("id,priority,priority_level,urgency_score,triage_score,status")
            .execute()
        )
        rows = []
        for row in response.data or []:
            status = str(row.get("status") or "").upper()
            if status not in {"WAITING", "AWAITING_REVIEW", "REGISTERED"}:
                continue
            if str(row.get("id")) == str(exclude_patient_id):
                continue
            rows.append(row)
        return rows
    except Exception:
        return []


def _save_recommendation(
    patient_id: str | None,
    recommendation: dict[str, Any],
    parent_id: str | None = None,
) -> str:
    generated_id = f"REC-{uuid4().hex[:10].upper()}"
    record = {
        "patient_id": patient_id,
        "action": "alternative_recommendation_generated" if parent_id else "recommendation_generated",
        "recommendation": recommendation,
        "status": "PENDING_VALIDATION",
    }
    try:
        response = supabase.table("audit_logs").insert(record).execute()
        if response.data:
            return str(response.data[0].get("id") or generated_id)
    except Exception as exc:
        print(f"[ai_routes] Could not persist recommendation audit: {exc}")
    return generated_id


def _get_recommendation(recommendation_id: str) -> dict[str, Any]:
    response = (
        supabase.table("audit_logs").select("*").eq("id", recommendation_id).execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return response.data[0]


def _update_audit_status(recommendation_id: str, status: str) -> None:
    try:
        supabase.table("audit_logs").update({"status": status}).eq(
            "id", recommendation_id
        ).execute()
    except Exception as exc:
        print(f"[ai_routes] Could not update recommendation status: {exc}")


def _validate_resource(
    rows: dict[str, dict[str, Any]],
    resource_id: Any,
    expected_type: str,
    code_prefix: str,
    errors: list[dict[str, str]],
    warnings: list[str],
) -> None:
    if not resource_id:
        warnings.append(f"No {expected_type} recommended")
        return
    row = rows.get(str(resource_id))
    if not row or row.get("resource_type") != expected_type:
        errors.append(
            {
                "code": f"{code_prefix}_NOT_FOUND",
                "message": f"{expected_type.title()} {resource_id} does not exist",
            }
        )
    elif row.get("is_available") is not True:
        errors.append(
            {
                "code": f"{code_prefix}_UNAVAILABLE",
                "message": f"{expected_type.title()} {resource_id} is unavailable",
            }
        )


def _allocate_recommendation(
    patient_id: str, recommendation: dict[str, Any]
) -> dict[str, Any]:
    rows = fetch_resources()
    by_id = {str(row.get("id")): row for row in rows}
    requested = [
        (recommendation.get("recommendedBedId"), "bed"),
        (recommendation.get("recommendedDoctorId"), "doctor"),
        *[
            (equipment_id, "equipment")
            for equipment_id in recommendation.get("requiredEquipmentIds") or []
        ],
    ]
    for resource_id, expected_type in requested:
        if not resource_id:
            continue
        row = by_id.get(str(resource_id))
        if (
            not row
            or row.get("resource_type") != expected_type
            or row.get("is_available") is not True
        ):
            raise HTTPException(
                status_code=409,
                detail=f"{expected_type.title()} {resource_id} is no longer available",
            )

    bed_id = recommendation.get("recommendedBedId")
    if bed_id:
        supabase.table("resources").update(
            {"is_available": False, "assigned_to": patient_id}
        ).eq("id", bed_id).execute()

    doctor_id = recommendation.get("recommendedDoctorId")
    if doctor_id:
        doctor = by_id[str(doctor_id)]
        next_load = int(doctor.get("workload_count") or doctor.get("workload") or 0) + 1
        try:
            supabase.table("resources").update({"workload_count": next_load}).eq(
                "id", doctor_id
            ).execute()
        except Exception:
            supabase.table("resources").update({"workload": next_load}).eq(
                "id", doctor_id
            ).execute()

    equipment_ids = recommendation.get("requiredEquipmentIds") or []
    for equipment_id in equipment_ids:
        supabase.table("resources").update(
            {"is_available": False, "assigned_to": patient_id}
        ).eq("id", equipment_id).execute()

    return {
        "unit": recommendation.get("recommendedUnit"),
        "bedId": bed_id,
        "doctorId": doctor_id,
        "equipmentIds": equipment_ids,
    }


def _to_frontend_recommendation(
    recommendation_id: str,
    patient_id: str,
    result: dict[str, Any],
    context: dict[str, Any],
) -> dict[str, Any]:
    resources = context["resources"]
    beds = {item["bedId"]: item for item in resources["availableBeds"]}
    doctors = {item["doctorId"]: item for item in resources["availableDoctors"]}
    equipment = {
        item["equipmentId"]: item for item in resources["availableEquipment"]
    }
    bed = beds.get(result.get("recommendedBedId"), {})
    doctor = doctors.get(result.get("recommendedDoctorId"), {})
    equipment_names = [
        equipment[item_id].get("name") or item_id
        for item_id in result.get("requiredEquipmentIds", [])
        if item_id in equipment
    ]
    alternative = result.get("alternativePlan") or {}
    issues = result.get("resourceConflicts") or []
    return {
        "id": recommendation_id,
        "patientId": patient_id,
        "payload": {
            "recommendedUnit": result["recommendedUnit"],
            "recommendedBed": bed.get("name") or result.get("recommendedBedId") or "Unassigned",
            "doctor": doctor.get("name") or result.get("recommendedDoctorId") or "Unassigned",
            "equipment": equipment_names,
            "reasons": result.get("reasoningSummary", []),
            "confidence": round(float(result.get("confidence", 0)) * 100),
            "basedOn": ["patient", "rule_engine", "resources", "queue"],
            "alternativePlan": "; ".join(alternative.get("actions", [])),
            "options": [
                {"label": result["recommendedUnit"], "risk": "low" if not issues else "medium"},
                {"label": alternative.get("unit", "Emergency Resuscitation"), "risk": "medium"},
            ],
        },
        "validationStatus": "fallback" if issues else "valid",
        "validationDetails": {
            "bedAvailable": bool(result.get("recommendedBedId")),
            "bedExists": bool(result.get("recommendedBedId")),
            "doctorAvailable": bool(result.get("recommendedDoctorId")),
            "doctorExists": bool(result.get("recommendedDoctorId")),
            "equipmentAvailable": True,
            "unitValid": True,
            "issues": issues,
        },
        "decision": "pending",
        "decidedBy": None,
        "overrideData": None,
        "createdAt": _now(),
        "decidedAt": None,
    }


def _priority_input(patient: dict[str, Any]) -> dict[str, Any]:
    vitals = normalize_vitals(patient)
    consciousness = normalize_consciousness(patient)
    return {
        "age": patient.get("age") or 50,
        "complaint": patient.get("complaint") or patient.get("main_problem") or "",
        "symptoms": patient.get("symptoms") or [],
        "consciousness": consciousness,
        "vitals": vitals,
        "oxygen_level": vitals.get("oxygenSaturation", 98),
        "blood_pressure_systolic": vitals.get("systolicBP", 120),
        "blood_pressure_diastolic": vitals.get("diastolicBP", 80),
        "is_conscious": consciousness != "UNCONSCIOUS",
        "main_problem": patient.get("complaint") or "",
        "heart_rate": vitals.get("heartRate", 80),
        "temperature": vitals.get("temperature", 37),
    }


def _active_alerts() -> list[dict[str, Any]]:
    try:
        response = supabase.table("alerts").select("*").eq("active", True).execute()
        return response.data or []
    except Exception:
        return []


def _pending_recommendations() -> list[dict[str, Any]]:
    try:
        response = (
            supabase.table("audit_logs")
            .select("id,patient_id,status")
            .eq("status", "PENDING_VALIDATION")
            .execute()
        )
        return response.data or []
    except Exception:
        return []


def _safe_resource_rows() -> list[dict[str, Any]]:
    try:
        return fetch_resources()
    except Exception:
        return []


def _unit_name(row: dict[str, Any]) -> str:
    unit = str(row.get("unit") or row.get("sub_type") or "Emergency")
    if unit.lower() in {"emergency", "er"}:
        return "Emergency Resuscitation"
    return unit.upper() if unit.lower() == "icu" else unit.replace("_", " ").title()


def _require_patient_id(patient_id: Any) -> str:
    if not patient_id:
        raise HTTPException(status_code=422, detail="patientId is required")
    return str(patient_id)


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _ok(data: Any) -> dict[str, Any]:
    return {"success": True, "data": data}