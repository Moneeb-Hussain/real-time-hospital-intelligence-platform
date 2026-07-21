"""
Build Spec AI context payload from Supabase rows.

Output shape:
{
  patient, ruleEngineResult, resources, currentQueue
}
"""

from __future__ import annotations

from typing import Any


def normalize_symptoms(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x) for x in raw]
    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            return []
        if "," in text:
            return [part.strip() for part in text.split(",") if part.strip()]
        return [text]
    return []


def normalize_vitals(patient: dict[str, Any]) -> dict[str, Any]:
    vitals = patient.get("vitals")
    if isinstance(vitals, dict) and vitals:
        return {
            "heartRate": _as_int(vitals.get("heartRate") or vitals.get("hr")),
            "oxygenSaturation": _as_int(
                vitals.get("oxygenSaturation") or vitals.get("spo2")
            ),
            "systolicBP": _as_int(
                vitals.get("systolicBP") or vitals.get("systolic")
            ),
            "diastolicBP": _as_int(
                vitals.get("diastolicBP") or vitals.get("diastolic")
            ),
            "temperature": _as_float(vitals.get("temperature") or vitals.get("temp")),
        }

    # Legacy flat columns (old schema)
    bp = patient.get("bloodpressure") or patient.get("blood_pressure") or ""
    systolic = patient.get("blood_pressure_systolic") or patient.get("systolicBP")
    diastolic = patient.get("blood_pressure_diastolic") or patient.get("diastolicBP")
    if isinstance(bp, str) and "/" in bp and (systolic is None or diastolic is None):
        left, right = bp.split("/", 1)
        systolic = systolic if systolic is not None else left.strip()
        diastolic = diastolic if diastolic is not None else right.strip()

    return {
        "heartRate": _as_int(
            patient.get("heart_rate") or patient.get("heartrate") or patient.get("hr")
        ),
        "oxygenSaturation": _as_int(
            patient.get("oxygen_level")
            or patient.get("oxygen")
            or patient.get("spo2")
            or patient.get("oxygenSaturation")
        ),
        "systolicBP": _as_int(systolic),
        "diastolicBP": _as_int(diastolic),
        "temperature": _as_float(patient.get("temperature")),
    }


def normalize_consciousness(patient: dict[str, Any]) -> str:
    value = patient.get("consciousness")
    if isinstance(value, bool):
        return "ALERT" if value else "UNCONSCIOUS"
    if value is None and "is_conscious" in patient:
        return "ALERT" if patient.get("is_conscious", True) else "UNCONSCIOUS"
    text = str(value or "ALERT").strip().upper()
    if text in {"TRUE", "1", "YES"}:
        return "ALERT"
    if text in {"FALSE", "0", "NO"}:
        return "UNCONSCIOUS"
    return text or "ALERT"


def patient_to_ai_block(patient: dict[str, Any]) -> dict[str, Any]:
    return {
        "patientId": str(patient.get("id")),
        "age": _as_int(patient.get("age")),
        "arrivalType": str(
            patient.get("arrival_type") or patient.get("arrivalType") or "WALK_IN"
        ).lower(),
        "complaint": patient.get("complaint") or patient.get("main_problem") or "",
        "symptoms": normalize_symptoms(patient.get("symptoms")),
        "vitals": normalize_vitals(patient),
        "consciousness": normalize_consciousness(patient).lower(),
    }


def rule_engine_to_ai_block(
    patient: dict[str, Any], priority: dict[str, Any]
) -> dict[str, Any]:
    reasons = (
        priority.get("reasons")
        or patient.get("triggered_rules")
        or patient.get("triggeredRules")
        or []
    )
    if isinstance(reasons, str):
        reasons = [reasons]
    level = priority.get("level") or patient.get("priority_level") or patient.get("priority") or "P4"
    if level not in {"P1", "P2", "P3", "P4"}:
        # Map old High/Medium labels if present
        lowered = str(level).lower()
        if lowered in {"high", "critical"}:
            level = "P1"
        elif lowered in {"medium", "urgent"}:
            level = "P2"
        else:
            level = "P4"
    return {
        "urgencyScore": _as_int(
            priority.get("score")
            or patient.get("urgency_score")
            or patient.get("triage_score"),
            default=0,
        ),
        "priority": level,
        "triggeredRules": [str(x) for x in reasons],
    }


def resources_to_ai_block(rows: list[dict[str, Any]]) -> dict[str, Any]:
    available = [row for row in rows if row.get("is_available") is True]
    beds = [
        {
            "bedId": str(row.get("id")),
            "unit": row.get("unit")
            or row.get("sub_type")
            or row.get("name")
            or row.get("resource_name")
            or "Unknown",
        }
        for row in available
        if row.get("resource_type") == "bed"
    ]
    doctors = [
        {
            "doctorId": str(row.get("id")),
            "specialty": row.get("specialty")
            or row.get("unit")
            or row.get("sub_type")
            or "Emergency",
            "currentLoad": _as_int(
                row.get("workload_count") or row.get("workload"), default=0
            ),
        }
        for row in available
        if row.get("resource_type") == "doctor"
    ]
    equipment = [
        {
            "equipmentId": str(row.get("id")),
            "name": row.get("name") or row.get("resource_name") or "Equipment",
        }
        for row in available
        if row.get("resource_type") == "equipment"
    ]
    doctors = sorted(doctors, key=lambda item: item["currentLoad"])
    icu_beds_available = sum(
        1
        for bed in beds
        if "icu" in str(bed.get("unit", "")).lower()
        or str(bed.get("bedId", "")).upper().startswith("ICU")
    )
    return {
        "availableBeds": beds,
        "availableDoctors": doctors,
        "availableEquipment": equipment,
        "icuBedsAvailable": icu_beds_available,
    }


def queue_to_ai_block(rows: list[dict[str, Any]], exclude_patient_id: str) -> list[dict[str, Any]]:
    queue = []
    for row in rows:
        if str(row.get("id")) == str(exclude_patient_id):
            continue
        priority = row.get("priority_level") or row.get("priority") or "P4"
        if priority not in {"P1", "P2", "P3", "P4"}:
            priority = "P4"
        queue.append(
            {
                "patientId": str(row.get("id")),
                "priority": priority,
                "urgencyScore": _as_int(
                    row.get("urgency_score") or row.get("triage_score"), default=0
                ),
            }
        )
    return sorted(queue, key=lambda item: item["urgencyScore"], reverse=True)


def build_ai_payload(
    patient: dict[str, Any],
    priority: dict[str, Any],
    resource_rows: list[dict[str, Any]],
    queue_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "patient": patient_to_ai_block(patient),
        "ruleEngineResult": rule_engine_to_ai_block(patient, priority),
        "resources": resources_to_ai_block(resource_rows),
        "currentQueue": queue_to_ai_block(queue_rows, str(patient.get("id"))),
    }


def _as_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default
