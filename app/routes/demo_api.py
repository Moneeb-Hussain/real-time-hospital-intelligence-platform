"""Demo/mock APIs matching what the Next.js frontend currently calls.

Resources/doctors/KPIs bed counts are read from Supabase when seeded.
Patients/alerts/recommendations stay mocked until those tables are wired.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database.supabase import get_supabase
from app.services.resource_service import (
    build_department_status,
    build_doctors_list,
    build_kpis_from_resources,
    build_live_dashboard_kpis,
    build_resources_inventory,
    build_resources_summary,
    fetch_resources,
)

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _ago(minutes: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ok(data: Any) -> dict:
    return {"success": True, "data": data}


def _resources_or_none() -> list[dict[str, Any]] | None:
    """Return DB rows, or None if unavailable / empty (caller may fall back to mock)."""
    try:
        rows = fetch_resources()
        return rows if rows else None
    except Exception:
        return None



PATIENTS = [
    {
        "id": "PT-001",
        "displayId": "PT-001",
        "name": "Hassan Al-Rashid",
        "age": 58,
        "gender": "male",
        "chiefComplaint": "Chest Pain",
        "symptoms": ["chest pain", "shortness of breath", "diaphoresis"],
        "vitals": {
            "heartRate": 118,
            "bpSystolic": 85,
            "bpDiastolic": 50,
            "spo2": 82,
            "temperature": 37.2,
            "conscious": True,
        },
        "urgencyScore": 92,
        "priority": "P1",
        "status": "waiting",
        "assignedBedId": None,
        "assignedDoctorId": None,
        "arrivedAt": _ago(8),
    },
    {
        "id": "PT-002",
        "displayId": "PT-002",
        "name": "Maria Rodriguez",
        "age": 67,
        "gender": "female",
        "chiefComplaint": "Facial Droop",
        "symptoms": ["facial droop", "arm weakness", "speech difficulty"],
        "vitals": {
            "heartRate": 95,
            "bpSystolic": 185,
            "bpDiastolic": 105,
            "spo2": 94,
            "temperature": 37.4,
            "conscious": True,
        },
        "urgencyScore": 88,
        "priority": "P1",
        "status": "waiting",
        "assignedBedId": None,
        "assignedDoctorId": None,
        "arrivedAt": _ago(12),
    },
    {
        "id": "PT-004",
        "displayId": "PT-004",
        "name": "Li Wei",
        "age": 34,
        "gender": "female",
        "chiefComplaint": "Breathing Difficulty",
        "symptoms": ["difficulty breathing", "wheezing"],
        "vitals": {
            "heartRate": 108,
            "bpSystolic": 130,
            "bpDiastolic": 82,
            "spo2": 91,
            "temperature": 37.6,
            "conscious": True,
        },
        "urgencyScore": 58,
        "priority": "P2",
        "status": "waiting",
        "assignedBedId": None,
        "assignedDoctorId": None,
        "arrivedAt": _ago(18),
    },
]

RECOMMENDATIONS = [
    {
        "id": "rec-1",
        "patientId": "PT-001",
        "payload": {
            "recommendedUnit": "Emergency Room",
            "recommendedBed": "ER-16",
            "doctor": "Dr. Ahmed Khan",
            "equipment": ["Cardiac Monitor", "Oxygen Concentrator"],
            "reasons": ["SpO2 82% — Severe Hypoxia", "No ICU bed available", "BP 85/50 — Hypotension"],
            "confidence": 72,
            "basedOn": ["oxygen", "blood_pressure", "resource_availability"],
            "alternativePlan": "Stabilize in ER. Monitor vitals. First in ICU transfer queue.",
            "options": [
                {"label": "Emergency Room Stabilization", "risk": "medium"},
                {"label": "Wait for ICU bed", "risk": "high"},
            ],
        },
        "validationStatus": "fallback",
        "validationDetails": {
            "bedAvailable": True,
            "bedExists": True,
            "doctorAvailable": True,
            "doctorExists": True,
            "equipmentAvailable": True,
            "unitValid": True,
            "issues": ["ICU bed not available — fallback to ER"],
        },
        "decision": "pending",
        "decidedBy": None,
        "overrideData": None,
        "createdAt": _ago(5),
        "decidedAt": None,
    },
    {
        "id": "rec-2",
        "patientId": "PT-002",
        "payload": {
            "recommendedUnit": "CCU",
            "recommendedBed": "CCU-7",
            "doctor": "Dr. Fatima Raza",
            "equipment": ["ECG Machine", "Cardiac Monitor"],
            "reasons": ["Stroke symptoms", "BP 185/105 Severe Hypertension", "Neurological emergency"],
            "confidence": 85,
            "basedOn": ["symptoms", "blood_pressure", "oxygen"],
            "alternativePlan": "If CCU unavailable, move to ER with neurologist on call.",
            "options": [
                {"label": "CCU Immediate", "risk": "low"},
                {"label": "ER Stabilization", "risk": "medium"},
            ],
        },
        "validationStatus": "valid",
        "validationDetails": {
            "bedAvailable": True,
            "bedExists": True,
            "doctorAvailable": True,
            "doctorExists": True,
            "equipmentAvailable": True,
            "unitValid": True,
            "issues": [],
        },
        "decision": "pending",
        "decidedBy": None,
        "overrideData": None,
        "createdAt": _ago(10),
        "decidedAt": None,
    },
]

ALERTS = [
    {
        "id": "ALT-01",
        "type": "ICU_FULL",
        "severity": "critical",
        "message": "No ICU beds available",
        "active": True,
        "createdAt": _ago(15),
        "acknowledgedAt": None,
        "acknowledgedBy": None,
    },
    {
        "id": "ALT-02",
        "type": "EQUIPMENT_OFFLINE",
        "severity": "warning",
        "message": "CT scanner is offline",
        "active": True,
        "createdAt": _ago(40),
        "acknowledgedAt": None,
        "acknowledgedBy": None,
    },
]

DOCTORS = [
    {
        "id": "doc-1",
        "name": "Dr. Ahmed Khan",
        "specialty": "Emergency Medicine",
        "department": "ER",
        "onShift": True,
        "maxLoad": 6,
        "currentLoad": 3,
        "status": "available",
        "avatarInitials": "AK",
    },
    {
        "id": "doc-2",
        "name": "Dr. Sarah Malik",
        "specialty": "Cardiology",
        "department": "CCU",
        "onShift": True,
        "maxLoad": 5,
        "currentLoad": 4,
        "status": "busy",
        "avatarInitials": "SM",
    },
    {
        "id": "doc-3",
        "name": "Dr. James Okonkwo",
        "specialty": "Critical Care",
        "department": "ICU",
        "onShift": True,
        "maxLoad": 4,
        "currentLoad": 4,
        "status": "busy",
        "avatarInitials": "JO",
    },
    {
        "id": "doc-4",
        "name": "Dr. Fatima Raza",
        "specialty": "Neurology",
        "department": "WARD",
        "onShift": True,
        "maxLoad": 6,
        "currentLoad": 2,
        "status": "available",
        "avatarInitials": "FR",
    },
]


@router.get("/api/health")
def api_health():
    return ok({"status": "ok"})


@router.get("/api/dashboard/kpis")
def dashboard_kpis():
    try:
        rows = fetch_resources()
        patients_res = get_supabase().table("patients").select("*").execute()
        patients = patients_res.data or []
        pending = 0
        try:
            recs = (
                get_supabase()
                .table("recommendations")
                .select("id")
                .in_("status", ["PENDING_VALIDATION", "AWAITING_HUMAN_APPROVAL"])
                .execute()
            )
            pending = len(recs.data or [])
        except Exception:
            pending = 0
        if rows or patients:
            return ok(build_live_dashboard_kpis(rows or [], patients, pending))
    except Exception as exc:
        print(f"[dashboard/kpis] live compute failed: {exc}")

    # Fallback mock only if DB unreachable
    return ok(
        {
            "activePatients": 0,
            "activePatientsPct": 0,
            "criticalPatients": 0,
            "criticalTrend": 0,
            "waitingPatients": 0,
            "waitingTrend": 0,
            "icuBedsAvailable": 0,
            "icuBedsTotal": 0,
            "bedsTotal": 0,
            "bedsOccupied": 0,
            "bedOccupancyPct": 0,
            "doctorsAvailable": 0,
            "doctorsTotal": 0,
            "avgWaitMinutes": 0,
            "avgWaitTrend": 0,
            "pendingRecommendations": 0,
            "hospitalHealthScore": 0,
        }
    )


@router.get("/api/hospital/health-score")
def hospital_health_score():
    try:
        rows = fetch_resources()
        patients_res = get_supabase().table("patients").select("id,status,priority").execute()
        kpis = build_live_dashboard_kpis(rows or [], patients_res.data or [], 0)
        return ok({"score": kpis["hospitalHealthScore"], "snapshotTime": _now()})
    except Exception:
        return ok({"score": 0, "snapshotTime": _now()})


@router.get("/api/dashboard")
def dashboard_summary():
    """Live waiting queue from Supabase; falls back to in-memory demo patients."""
    try:
        patients_res = get_supabase().table("patients").select("*").execute()
        resources_res = get_supabase().table("resources").select("*").execute()
        patients = patients_res.data or []
        resources = resources_res.data or []
        if patients:
            doctors_by_id = {
                str(r.get("id")): (r.get("name") or str(r.get("id")))
                for r in resources
                if r.get("resource_type") == "doctor"
            }
            waiting_rows = [
                p
                for p in patients
                if str(p.get("status") or "").upper()
                in {"WAITING", "AWAITING_REVIEW", "REGISTERED"}
            ]
            queue_preview = sorted(
                [
                    {
                        "patientId": str(p.get("id")),
                        "name": p.get("name"),
                        "age": p.get("age"),
                        "gender": p.get("gender"),
                        "complaint": p.get("complaint"),
                        "symptoms": p.get("symptoms") or [],
                        "vitals": p.get("vitals") or {},
                        "consciousness": p.get("consciousness"),
                        "priority": p.get("priority") or "P4",
                        "urgencyScore": p.get("urgency_score") or 0,
                        "createdAt": p.get("created_at"),
                        "status": p.get("status"),
                        "assignedDoctorId": p.get("assigned_doctor_id"),
                        "assignedDoctorName": doctors_by_id.get(
                            str(p.get("assigned_doctor_id") or "")
                        ),
                        "assignedBedId": p.get("assigned_bed_id"),
                    }
                    for p in waiting_rows
                ],
                key=lambda item: item["urgencyScore"],
                reverse=True,
            )
            return ok(
                {
                    "summary": {
                        "waitingPatients": len(waiting_rows),
                        "criticalPatients": len(
                            [p for p in waiting_rows if p.get("priority") == "P1"]
                        ),
                    },
                    "queuePreview": queue_preview,
                    "waitingPatients": queue_preview,
                    "totalWaiting": len(waiting_rows),
                }
            )
    except Exception:
        pass

    waiting = [p for p in PATIENTS if p["status"] == "waiting"]
    return ok(
        {
            "waitingPatients": waiting,
            "totalWaiting": len(waiting),
            "criticalPatients": [p for p in PATIENTS if p["priority"] == "P1"],
        }
    )


@router.get("/api/patients")
def list_patients():
    """Full patient directory for the Patients page."""
    try:
        supabase = get_supabase()
        prow = (
            supabase.table("patients")
            .select("*")
            .order("urgency_score", desc=True)
            .execute()
        )
        rows = prow.data or []
        if rows:
            return ok([_map_patient_row(p) for p in rows])
    except Exception:
        pass
    return ok(PATIENTS)


def _map_patient_status(raw: Any) -> str:
    s = str(raw or "waiting").upper().replace(" ", "_")
    mapping = {
        "WAITING": "waiting",
        "AWAITING_REVIEW": "waiting",
        "REGISTERED": "waiting",
        "ASSIGNED": "assigned",
        "IN_TREATMENT": "in_treatment",
        "TREATING": "in_treatment",
        "TRANSFERRED": "transferred",
        "DISCHARGED": "discharged",
    }
    return mapping.get(s, s.lower())


def _map_patient_row(p: dict[str, Any]) -> dict[str, Any]:
    v = p.get("vitals") or {}
    gender = str(p.get("gender") or "other").lower()
    if gender not in {"male", "female", "other"}:
        gender = "other"
    return {
        "id": str(p.get("id")),
        "displayId": str(p.get("id")),
        "name": p.get("name") or str(p.get("id")),
        "age": int(p.get("age") or 0),
        "gender": gender,
        "chiefComplaint": p.get("complaint") or "",
        "symptoms": p.get("symptoms") or [],
        "vitals": {
            "heartRate": v.get("heartRate") or 0,
            "bpSystolic": v.get("systolicBP") or 0,
            "bpDiastolic": v.get("diastolicBP") or 0,
            "spo2": v.get("oxygenSaturation") or 0,
            "temperature": v.get("temperature") or 0,
            "conscious": str(p.get("consciousness") or "ALERT").upper() != "UNCONSCIOUS",
        },
        "urgencyScore": int(p.get("urgency_score") or 0),
        "priority": p.get("priority") or "P4",
        "status": _map_patient_status(p.get("status")),
        "assignedBedId": p.get("assigned_bed_id"),
        "assignedDoctorId": p.get("assigned_doctor_id"),
        "arrivedAt": p.get("created_at") or _now(),
    }


@router.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    """Live patient + pending recommendation + recent activity."""
    try:
        supabase = get_supabase()
        prow = (
            supabase.table("patients").select("*").eq("id", patient_id).limit(1).execute()
        )
        if prow.data:
            patient = _map_patient_row(prow.data[0])
            recs = (
                supabase.table("recommendations")
                .select("*")
                .eq("patient_id", patient_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            recommendation = None
            if recs.data:
                docs = (
                    supabase.table("resources")
                    .select("id,name")
                    .eq("resource_type", "doctor")
                    .execute()
                )
                doctors_by_id = {
                    str(d.get("id")): (d.get("name") or str(d.get("id")))
                    for d in (docs.data or [])
                }
                recommendation = _map_recommendation(recs.data[0], doctors_by_id)
            acts = (
                supabase.table("audit_logs")
                .select("*")
                .eq("patient_id", patient_id)
                .order("created_at", desc=True)
                .limit(12)
                .execute()
            )
            activity = [_map_activity(a) for a in (acts.data or [])]
            return ok({"patient": patient, "recommendation": recommendation, "activity": activity})
    except Exception:
        pass

    patient = next((p for p in PATIENTS if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    recommendation = next((r for r in RECOMMENDATIONS if r["patientId"] == patient_id), None)
    return ok({"patient": patient, "recommendation": recommendation, "activity": []})


def _map_alert(row: dict[str, Any]) -> dict[str, Any]:
    raw_type = str(row.get("type") or "SYSTEM")
    type_aliases = {
        "DOCTOR_OVERLOAD": "DOCTOR_OVERLOADED",
        "DOCTOR_OVERLOADED": "DOCTOR_OVERLOADED",
    }
    severity = str(row.get("severity") or "warning").lower()
    if severity not in {"critical", "warning", "info"}:
        severity = "warning"
    created = row.get("created_at") or row.get("createdAt") or _now()
    if isinstance(created, datetime):
        created = created.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return {
        "id": row.get("id"),
        "type": type_aliases.get(raw_type, raw_type),
        "severity": severity,
        "message": row.get("message") or "",
        "active": bool(row.get("active", True)),
        "createdAt": created,
        "acknowledgedAt": row.get("acknowledged_at") or row.get("acknowledgedAt"),
        "acknowledgedBy": row.get("acknowledged_by") or row.get("acknowledgedBy"),
    }


def _alerts_from_db(status: Optional[str] = None) -> list[dict[str, Any]] | None:
    try:
        query = get_supabase().table("alerts").select("*").order("created_at", desc=True)
        if status == "active":
            query = query.eq("active", True)
        response = query.execute()
        rows = response.data or []
        return [_map_alert(r) for r in rows]
    except Exception:
        return None


@router.get("/api/alerts")
def get_alerts(status: Optional[str] = None):
    live = _alerts_from_db(status)
    if live is not None:
        return ok(live)
    data = ALERTS
    if status == "active":
        data = [a for a in ALERTS if a["active"]]
    return ok(data)


class AcknowledgeBody(BaseModel):
    acknowledgedBy: str


@router.patch("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, body: AcknowledgeBody):
    try:
        supabase = get_supabase()
        stamped = _now()
        response = (
            supabase.table("alerts")
            .update(
                {
                    "active": False,
                    "acknowledged_at": stamped,
                    "acknowledged_by": body.acknowledgedBy,
                }
            )
            .eq("id", alert_id)
            .execute()
        )
        rows = response.data or []
        if rows:
            return ok(_map_alert(rows[0]))
    except Exception:
        pass

    alert = next((a for a in ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["active"] = False
    alert["acknowledgedAt"] = _now()
    alert["acknowledgedBy"] = body.acknowledgedBy
    return ok(alert)


def _map_recommendation(row: dict[str, Any], doctors_by_id: dict[str, str] | None = None) -> dict[str, Any]:
    """Map Spec `recommendations` row → frontend Recommendation shape."""
    doctors_by_id = doctors_by_id or {}
    raw = row.get("recommendation") or {}
    if isinstance(raw, str):
        raw = {}

    conf = raw.get("confidence", 0) or 0
    try:
        conf_f = float(conf)
        confidence = int(round(conf_f * 100)) if conf_f <= 1 else int(round(conf_f))
    except Exception:
        confidence = 0

    alt = raw.get("alternativePlan")
    if isinstance(alt, dict):
        actions = alt.get("actions") or []
        alt_text = ". ".join(str(a) for a in actions) if actions else str(alt.get("unit") or "")
    else:
        alt_text = str(alt or "")

    doctor_id = raw.get("recommendedDoctorId") or raw.get("doctorId")
    doctor_name = doctors_by_id.get(str(doctor_id or ""), str(doctor_id or "Unassigned"))

    reasons = raw.get("reasoningSummary") or raw.get("reasons") or []
    if not isinstance(reasons, list):
        reasons = [str(reasons)]

    equipment = raw.get("requiredEquipmentIds") or raw.get("equipment") or []
    if not isinstance(equipment, list):
        equipment = []

    warnings = row.get("validation_warnings") or []
    if isinstance(warnings, str):
        warnings = [warnings]
    conflicts = raw.get("resourceConflicts") or []
    if not isinstance(conflicts, list):
        conflicts = []

    is_valid = row.get("is_valid")
    if is_valid is False:
        validation_status = "invalid"
    elif conflicts or (warnings and is_valid is not True):
        validation_status = "fallback"
    elif warnings:
        validation_status = "partial"
    elif is_valid is True:
        validation_status = "valid"
    else:
        validation_status = "partial"

    status = str(row.get("status") or "").upper()
    decision_col = str(row.get("decision") or "").lower()
    if decision_col in {"approved", "rejected", "overridden", "pending"}:
        decision = decision_col
    elif status in {"APPROVED"}:
        decision = "approved"
    elif status in {"REJECTED"}:
        decision = "rejected"
    elif status in {"OVERRIDDEN"}:
        decision = "overridden"
    elif status in {"AWAITING_HUMAN_APPROVAL", "PENDING_VALIDATION", "VALIDATED"}:
        decision = "pending"
    else:
        decision = "pending"

    created = row.get("created_at") or _now()
    if isinstance(created, datetime):
        created = created.replace(microsecond=0).isoformat().replace("+00:00", "Z")

    decided = row.get("decided_at")
    if isinstance(decided, datetime):
        decided = decided.replace(microsecond=0).isoformat().replace("+00:00", "Z")

    return {
        "id": row.get("id"),
        "patientId": row.get("patient_id"),
        "payload": {
            "recommendedUnit": raw.get("recommendedUnit") or "Unspecified",
            "recommendedBed": raw.get("recommendedBedId") or raw.get("recommendedBed") or "—",
            "doctor": doctor_name,
            "equipment": [str(e) for e in equipment],
            "reasons": [str(r) for r in reasons][:5],
            "confidence": confidence,
            "basedOn": raw.get("basedOn") or ["vitals", "resources"],
            "alternativePlan": alt_text,
            "options": raw.get("options") or [],
        },
        "validationStatus": validation_status,
        "validationDetails": {
            "bedAvailable": True,
            "bedExists": True,
            "doctorAvailable": True,
            "doctorExists": True,
            "equipmentAvailable": True,
            "unitValid": True,
            "issues": [str(w) for w in (warnings or conflicts)][:5],
        },
        "decision": decision,
        "decidedBy": row.get("reviewed_by"),
        "overrideData": row.get("override_allocation"),
        "createdAt": created,
        "decidedAt": decided,
    }


def _recommendations_from_db(status: Optional[str] = None) -> list[dict[str, Any]] | None:
    try:
        supabase = get_supabase()
        docs = (
            supabase.table("resources")
            .select("id,name")
            .eq("resource_type", "doctor")
            .execute()
        )
        doctors_by_id = {
            str(d.get("id")): (d.get("name") or str(d.get("id")))
            for d in (docs.data or [])
        }
        patients_res = supabase.table("patients").select(
            "id,name,complaint,priority,urgency_score,status"
        ).execute()
        patients_by_id = {
            str(p.get("id")): p for p in (patients_res.data or [])
        }
        response = (
            supabase.table("recommendations")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        mapped = []
        for r in response.data or []:
            item = _map_recommendation(r, doctors_by_id)
            patient = patients_by_id.get(str(item.get("patientId") or ""))
            if patient:
                item["patientName"] = patient.get("name")
                item["complaint"] = patient.get("complaint")
                item["patientPriority"] = patient.get("priority")
                item["urgencyScore"] = patient.get("urgency_score")
            mapped.append(item)
        if status:
            mapped = [r for r in mapped if r.get("decision") == status]
        return mapped
    except Exception:
        return None


def _map_activity(row: dict[str, Any]) -> dict[str, Any]:
    meta = row.get("meta") or {}
    if not isinstance(meta, dict):
        meta = {}
    created = row.get("created_at") or _now()
    if isinstance(created, datetime):
        created = created.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    detail = {
        **meta,
        "description": row.get("description"),
        "patientId": row.get("patient_id"),
    }
    if meta.get("priority"):
        detail["priority"] = meta.get("priority")
    if meta.get("type"):
        detail["alertType"] = meta.get("type")
    return {
        "id": row.get("id"),
        "patientId": row.get("patient_id"),
        "event": row.get("action") or "resource_status_changed",
        "detail": detail,
        "createdAt": created,
    }


def _activity_from_db(limit: int = 20) -> list[dict[str, Any]] | None:
    try:
        response = (
            get_supabase()
            .table("audit_logs")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [_map_activity(r) for r in (response.data or [])]
    except Exception:
        return None


@router.get("/api/recommendations")
def get_recommendations(status: Optional[str] = None):
    live = _recommendations_from_db(status)
    if live is not None:
        return ok(live)
    data = RECOMMENDATIONS
    if status:
        data = [r for r in RECOMMENDATIONS if r["decision"] == status]
    return ok(data)


class DecisionBody(BaseModel):
    approvedBy: Optional[str] = None
    rejectedBy: Optional[str] = None
    notes: Optional[str] = None
    reason: Optional[str] = None


def _apply_recommendation_decision(
    rec_id: str,
    decision: str,
    reviewed_by: str,
    reason: Optional[str] = None,
) -> dict[str, Any]:
    supabase = get_supabase()
    found = (
        supabase.table("recommendations").select("*").eq("id", rec_id).limit(1).execute()
    )
    rows = found.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    row = rows[0]
    raw = row.get("recommendation") or {}
    if not isinstance(raw, dict):
        raw = {}

    stamped = _now()
    status_map = {
        "approved": "APPROVED",
        "rejected": "REJECTED",
        "overridden": "OVERRIDDEN",
    }
    update_payload: dict[str, Any] = {
        "decision": decision,
        "status": status_map.get(decision, decision.upper()),
        "reviewed_by": reviewed_by,
        "decided_at": stamped,
        "updated_at": stamped,
    }
    if reason:
        update_payload["override_reason"] = reason

    updated = (
        supabase.table("recommendations")
        .update(update_payload)
        .eq("id", rec_id)
        .execute()
    )
    updated_row = (updated.data or [row])[0]

    patient_id = str(row.get("patient_id") or "")
    patient = None
    if patient_id and decision == "approved":
        bed_id = raw.get("recommendedBedId")
        doctor_id = raw.get("recommendedDoctorId")
        unit = raw.get("recommendedUnit")
        patient_update = {
            "status": "ALLOCATED",
            "assigned_unit": unit,
            "assigned_bed_id": bed_id,
            "assigned_doctor_id": doctor_id,
            "updated_at": stamped,
        }
        patient_res = (
            supabase.table("patients").update(patient_update).eq("id", patient_id).execute()
        )
        patient = (patient_res.data or [None])[0]
        if bed_id:
            try:
                supabase.table("resources").update(
                    {"is_available": False, "assigned_to": patient_id, "last_updated": stamped}
                ).eq("id", bed_id).execute()
            except Exception:
                pass
        if doctor_id:
            try:
                supabase.table("resources").update(
                    {"is_available": True, "last_updated": stamped}
                ).eq("id", doctor_id).execute()
            except Exception:
                pass
    elif patient_id:
        patient_res = (
            supabase.table("patients").select("*").eq("id", patient_id).limit(1).execute()
        )
        patient = (patient_res.data or [None])[0]

    try:
        supabase.table("audit_logs").insert(
            {
                "patient_id": patient_id or None,
                "action": f"recommendation_{decision}",
                "description": f"Recommendation {rec_id} {decision} by {reviewed_by}",
                "actor": reviewed_by,
                "status": decision.upper(),
                "meta": {"recommendationId": rec_id},
            }
        ).execute()
    except Exception:
        pass

    docs = (
        supabase.table("resources")
        .select("id,name")
        .eq("resource_type", "doctor")
        .execute()
    )
    doctors_by_id = {
        str(d.get("id")): (d.get("name") or str(d.get("id")))
        for d in (docs.data or [])
    }
    mapped = _map_recommendation(updated_row, doctors_by_id)
    return {"recommendation": mapped, "patient": patient}


@router.post("/api/recommendations/{rec_id}/approve")
def approve_recommendation(rec_id: str, body: DecisionBody):
    try:
        result = _apply_recommendation_decision(
            rec_id, "approved", body.approvedBy or "Hospital Operator", body.notes
        )
        return ok(result)
    except HTTPException:
        raise
    except Exception:
        pass

    rec = next((r for r in RECOMMENDATIONS if r["id"] == rec_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec["decision"] = "approved"
    rec["decidedBy"] = body.approvedBy
    rec["decidedAt"] = _now()
    patient = next((p for p in PATIENTS if p["id"] == rec["patientId"]), PATIENTS[0])
    return ok({"recommendation": rec, "patient": patient})


@router.post("/api/recommendations/{rec_id}/reject")
def reject_recommendation(rec_id: str, body: DecisionBody):
    try:
        result = _apply_recommendation_decision(
            rec_id,
            "rejected",
            body.rejectedBy or "Hospital Operator",
            body.reason,
        )
        return ok({"recommendation": result["recommendation"]})
    except HTTPException:
        raise
    except Exception:
        pass

    rec = next((r for r in RECOMMENDATIONS if r["id"] == rec_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec["decision"] = "rejected"
    rec["decidedBy"] = body.rejectedBy
    rec["decidedAt"] = _now()
    return ok(rec)


@router.post("/api/recommendations/{rec_id}/override")
def override_recommendation(rec_id: str, body: dict):
    rec = next((r for r in RECOMMENDATIONS if r["id"] == rec_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec["decision"] = "overridden"
    rec["overrideData"] = body
    rec["decidedAt"] = _now()
    patient = next((p for p in PATIENTS if p["id"] == rec["patientId"]), PATIENTS[0])
    return ok({"recommendation": rec, "patient": patient})


@router.post("/api/recommendations/{rec_id}/recalculate")
def recalculate_recommendation(rec_id: str, body: dict):
    rec = next((r for r in RECOMMENDATIONS if r["id"] == rec_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec["createdAt"] = _now()
    return ok(rec)


@router.get("/api/resources/inventory")
def resources_inventory():
    """Full bed / doctor / equipment inventory for the Resources page."""
    rows = _resources_or_none()
    if rows is not None:
        return ok(build_resources_inventory(rows))
    return ok(build_resources_inventory([]))


@router.get("/api/resources/summary")
def resources_summary():
    rows = _resources_or_none()
    if rows is not None:
        return ok(build_resources_summary(rows))
    return ok(
        {
            "timestamp": _now(),
            "beds": {
                "icu": {
                    "available": 1,
                    "total": 10,
                    "occupancyPct": 90,
                    "availableBeds": [
                        {
                            "id": "bed-icu-10",
                            "unitId": "unit-icu",
                            "unitCode": "ICU",
                            "label": "ICU-10",
                            "status": "available",
                            "patientId": None,
                            "occupiedSince": None,
                        }
                    ],
                },
                "er": {
                    "available": 5,
                    "total": 20,
                    "occupancyPct": 75,
                    "availableBeds": [],
                },
                "ward": {"available": 18, "total": 40, "occupancyPct": 55},
                "ccu": {"available": 2, "total": 8, "occupancyPct": 75},
            },
            "doctors": {"available": [d for d in DOCTORS if d["status"] == "available"], "all": DOCTORS},
            "equipment": {
                "cardiacMonitor": {"available": 2, "total": 3, "occupancyPct": 33, "availableItems": []},
                "ventilator": {"available": 1, "total": 3, "occupancyPct": 67, "availableItems": []},
                "ecgMachine": {"available": 1, "total": 2, "occupancyPct": 50, "availableItems": []},
                "defibrillator": {"available": 2, "total": 2, "occupancyPct": 0, "availableItems": []},
                "oxygenConc": {"available": 1, "total": 2, "occupancyPct": 50, "availableItems": []},
            },
            "queue": {
                "p1Count": 3,
                "p2Count": 2,
                "p3Count": 1,
                "p4Count": 1,
                "avgWaitMinutes": 19,
                "longestWaitMinutes": 50,
            },
            "hospitalHealthScore": 63,
        }
    )


@router.get("/api/departments/status")
def departments_status():
    rows = _resources_or_none()
    if rows is not None:
        return ok(build_department_status(rows))
    return ok(
        [
            {
                "unitCode": "ICU",
                "unitName": "Intensive Care Unit",
                "totalBeds": 10,
                "occupiedBeds": 9,
                "occupancyPct": 90,
                "criticalPatients": 3,
                "status": "critical",
            },
            {
                "unitCode": "ER",
                "unitName": "Emergency Room",
                "totalBeds": 20,
                "occupiedBeds": 15,
                "occupancyPct": 75,
                "criticalPatients": 2,
                "status": "busy",
            },
            {
                "unitCode": "CCU",
                "unitName": "Cardiac Care Unit",
                "totalBeds": 8,
                "occupiedBeds": 6,
                "occupancyPct": 75,
                "criticalPatients": 1,
                "status": "busy",
            },
            {
                "unitCode": "WARD",
                "unitName": "General Ward",
                "totalBeds": 40,
                "occupiedBeds": 22,
                "occupancyPct": 55,
                "criticalPatients": 0,
                "status": "normal",
            },
        ]
    )


@router.get("/api/doctors")
def get_doctors():
    rows = _resources_or_none()
    if rows is not None:
        return ok(build_doctors_list(rows))
    return ok(DOCTORS)


@router.get("/api/analytics/charts")
def analytics_charts():
    """Live charts from patients + doctor workload (falls back to empty series)."""
    try:
        supabase = get_supabase()
        patients = (
            supabase.table("patients")
            .select("id,priority,status,created_at")
            .execute()
            .data
            or []
        )
        doctors = build_doctors_list(fetch_resources())

        priority_counts = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}
        for p in patients:
            pr = str(p.get("priority") or "P4").upper()
            if pr in priority_counts:
                priority_counts[pr] += 1

        now = datetime.now(timezone.utc)
        day_counts: dict[str, int] = {}
        day_labels: list[str] = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            label = day.strftime("%a")
            key = day.isoformat()
            day_labels.append(label)
            day_counts[key] = 0

        for p in patients:
            raw = p.get("created_at")
            if not raw:
                continue
            try:
                text = str(raw).replace("Z", "+00:00")
                dt = datetime.fromisoformat(text)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                key = dt.astimezone(timezone.utc).date().isoformat()
                if key in day_counts:
                    day_counts[key] += 1
            except Exception:
                continue

        admissions7d = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            admissions7d.append(
                {"label": day.strftime("%a"), "value": day_counts.get(day.isoformat(), 0)}
            )

        # Wait trend: average wait (minutes) for currently waiting patients, by arrival hour
        waiting_statuses = {"WAITING", "AWAITING_REVIEW", "REGISTERED"}
        hour_buckets: dict[int, list[float]] = {}
        for p in patients:
            if str(p.get("status") or "").upper() not in waiting_statuses:
                continue
            raw = p.get("created_at")
            if not raw:
                continue
            try:
                text = str(raw).replace("Z", "+00:00")
                arrived = datetime.fromisoformat(text)
                if arrived.tzinfo is None:
                    arrived = arrived.replace(tzinfo=timezone.utc)
                wait_m = max(0.0, (now - arrived).total_seconds() / 60.0)
                hour = arrived.astimezone(timezone.utc).hour
                hour_buckets.setdefault(hour, []).append(wait_m)
            except Exception:
                continue

        if hour_buckets:
            wait_trend = [
                {
                    "label": f"{h:02d}:00",
                    "value": int(round(sum(vals) / len(vals))),
                }
                for h, vals in sorted(hour_buckets.items())
            ]
        else:
            # No waiting patients — still show a live zero point for the current hour
            wait_trend = [{"label": f"{now.hour:02d}:00", "value": 0}]

        doctor_workload = [
            {
                "label": (d.get("name") or "Doctor").replace("Dr. ", "Dr. "),
                "value": int(d.get("currentLoad") or 0),
                "max": int(d.get("maxLoad") or 6),
            }
            for d in doctors
            if d.get("onShift") or d.get("status") != "off_shift"
        ]

        return ok(
            {
                "priorityMix": [
                    {"label": "P1", "value": priority_counts["P1"]},
                    {"label": "P2", "value": priority_counts["P2"]},
                    {"label": "P3", "value": priority_counts["P3"]},
                    {"label": "P4", "value": priority_counts["P4"]},
                ],
                "admissions7d": admissions7d,
                "waitTrend": wait_trend,
                "doctorWorkload": doctor_workload,
            }
        )
    except Exception:
        return ok(
            {
                "priorityMix": [
                    {"label": "P1", "value": 0},
                    {"label": "P2", "value": 0},
                    {"label": "P3", "value": 0},
                    {"label": "P4", "value": 0},
                ],
                "admissions7d": [],
                "waitTrend": [],
                "doctorWorkload": [],
            }
        )


@router.get("/api/activity-log")
def activity_log(limit: int = 20):
    live = _activity_from_db(limit)
    if live is not None:
        return ok(live)
    data = [
        {
            "id": "al-1",
            "patientId": "PT-001",
            "event": "patient_arrived",
            "detail": {"displayId": "PT-001", "priority": "P1"},
            "createdAt": _ago(8),
        },
        {
            "id": "al-2",
            "patientId": "PT-002",
            "event": "patient_arrived",
            "detail": {"displayId": "PT-002", "priority": "P1"},
            "createdAt": _ago(12),
        },
        {
            "id": "al-3",
            "patientId": None,
            "event": "alert_fired",
            "detail": {"type": "ICU_FULL", "severity": "critical", "alertType": "ICU_FULL"},
            "createdAt": _ago(15),
        },
    ]
    return ok(data[:limit])


class AiPatientBody(BaseModel):
    patientId: str


@router.post("/api/ai/recommendation")
def ai_recommendation(body: AiPatientBody):
    rec = next((r for r in RECOMMENDATIONS if r["patientId"] == body.patientId), RECOMMENDATIONS[0])
    return ok(rec)


class BriefingBody(BaseModel):
    requestedBy: str


@router.post("/api/ai/briefing")
def ai_briefing(body: BriefingBody):
    return ok(
        {
            "briefing": f"Hospital status briefing for {body.requestedBy}: ICU at 90% capacity, 3 critical patients waiting, 2 pending AI recommendations.",
            "highlights": [
                "ICU nearly full",
                "2 P1 patients awaiting review",
                "CT scanner offline",
            ],
        }
    )


class ShiftReportBody(BaseModel):
    shiftStart: str
    shiftEnd: str


@router.post("/api/ai/shift-report")
def ai_shift_report(body: ShiftReportBody):
    return ok(
        {
            "report": f"Shift report {body.shiftStart} → {body.shiftEnd}: admissions stable, ICU pressure high.",
            "pendingItems": ["Approve REC for PT-001", "Restock cardiac monitors"],
            "immediateActions": ["Call backup ER doctor", "Prepare ICU transfer queue"],
        }
    )


@router.post("/api/ai/simulate")
def ai_simulate(body: dict):
    """Fallback simulate — still uses live resources when available."""
    try:
        from app.services.ai_service import generate_simulation_insights
        from app.services.resource_service import (
            build_resources_summary,
            enrich_summary_queue,
            fetch_resources,
        )

        rows = fetch_resources()
        snapshot = build_resources_summary(rows)
        try:
            patients_res = get_supabase().table("patients").select(
                "id,status,priority,created_at"
            ).execute()
            snapshot = enrich_summary_queue(snapshot, patients_res.data or [])
        except Exception:
            pass
        return ok(generate_simulation_insights(body or {}, snapshot))
    except Exception:
        return ok(
            {
                "summary": "Simulation unavailable — could not read live capacity.",
                "riskLevel": "MEDIUM",
                "baseline": {},
                "projectedImpact": {
                    "waitTimeChangeMinutes": 0,
                    "doctorLoadChangePercentage": 0,
                    "additionalIcuBedsRequired": 0,
                },
                "bottlenecks": ["Live resource data unavailable"],
                "recommendedActions": ["Retry after confirming API / Supabase connection"],
            }
        )


@router.post("/api/recommendations/generate")
def generate_recommendation_alias(payload: dict):
    """Keep existing AI route shape available under frontend-friendly path."""
    from app.services.ai_service import generate_ai_recommendation

    return ok(generate_ai_recommendation(payload))
