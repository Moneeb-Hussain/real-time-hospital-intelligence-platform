"""Demo/mock APIs matching what the Next.js frontend currently calls.

Resources/doctors/KPIs bed counts are read from Supabase when seeded.
Patients/alerts/recommendations stay mocked until those tables are wired.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.resource_service import (
    build_department_status,
    build_doctors_list,
    build_kpis_from_resources,
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
    rows = _resources_or_none()
    if rows is not None:
        kpis = build_kpis_from_resources(rows)
        # Keep patient/rec counts from mock until patients table is wired
        kpis["criticalPatients"] = 3
        kpis["waitingPatients"] = 6
        kpis["pendingRecommendations"] = 2
        kpis["criticalTrend"] = 12
        kpis["waitingTrend"] = -5
        kpis["avgWaitMinutes"] = 19
        kpis["avgWaitTrend"] = 8
        return ok(kpis)
    return ok(
        {
            "criticalPatients": 3,
            "criticalTrend": 12,
            "waitingPatients": 6,
            "waitingTrend": -5,
            "icuBedsAvailable": 1,
            "icuBedsTotal": 10,
            "doctorsAvailable": 4,
            "doctorsTotal": 8,
            "avgWaitMinutes": 19,
            "avgWaitTrend": 8,
            "pendingRecommendations": 2,
            "hospitalHealthScore": 63,
        }
    )


@router.get("/api/hospital/health-score")
def hospital_health_score():
    return ok({"score": 63, "snapshotTime": _now()})


@router.get("/api/dashboard")
def dashboard_summary():
    waiting = [p for p in PATIENTS if p["status"] == "waiting"]
    return ok(
        {
            "waitingPatients": waiting,
            "totalWaiting": len(waiting),
            "criticalPatients": [p for p in PATIENTS if p["priority"] == "P1"],
        }
    )


@router.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    patient = next((p for p in PATIENTS if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    recommendation = next((r for r in RECOMMENDATIONS if r["patientId"] == patient_id), None)
    return ok({"patient": patient, "recommendation": recommendation, "activity": []})


@router.get("/api/alerts")
def get_alerts(status: Optional[str] = None):
    data = ALERTS
    if status == "active":
        data = [a for a in ALERTS if a["active"]]
    return ok(data)


class AcknowledgeBody(BaseModel):
    acknowledgedBy: str


@router.patch("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, body: AcknowledgeBody):
    alert = next((a for a in ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["active"] = False
    alert["acknowledgedAt"] = _now()
    alert["acknowledgedBy"] = body.acknowledgedBy
    return ok(alert)


@router.get("/api/recommendations")
def get_recommendations(status: Optional[str] = None):
    data = RECOMMENDATIONS
    if status:
        data = [r for r in RECOMMENDATIONS if r["decision"] == status]
    return ok(data)


class DecisionBody(BaseModel):
    approvedBy: Optional[str] = None
    rejectedBy: Optional[str] = None
    notes: Optional[str] = None
    reason: Optional[str] = None


@router.post("/api/recommendations/{rec_id}/approve")
def approve_recommendation(rec_id: str, body: DecisionBody):
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
    return ok(
        {
            "priorityMix": [
                {"label": "P1", "value": 3},
                {"label": "P2", "value": 2},
                {"label": "P3", "value": 1},
                {"label": "P4", "value": 1},
            ],
            "admissions7d": [
                {"label": "Mon", "value": 18},
                {"label": "Tue", "value": 22},
                {"label": "Wed", "value": 26},
                {"label": "Thu", "value": 19},
                {"label": "Fri", "value": 31},
                {"label": "Sat", "value": 28},
                {"label": "Sun", "value": 24},
            ],
            "waitTrend": [
                {"label": "08:00", "value": 11},
                {"label": "09:00", "value": 15},
                {"label": "10:00", "value": 18},
                {"label": "11:00", "value": 22},
                {"label": "12:00", "value": 19},
            ],
            "doctorWorkload": [
                {"label": "Dr. Ahmed Khan", "value": 3, "max": 6},
                {"label": "Dr. Sarah Malik", "value": 4, "max": 5},
                {"label": "Dr. Fatima Raza", "value": 2, "max": 6},
                {"label": "Dr. Leila Hassan", "value": 5, "max": 6},
                {"label": "Dr. Aisha Patel", "value": 3, "max": 7},
            ],
        }
    )


@router.get("/api/activity-log")
def activity_log(limit: int = 20):
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
            "detail": {"type": "ICU_FULL", "severity": "critical"},
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
    return ok(
        {
            "summary": "Simulation complete. Emergency occupancy rises; doctor load approaches capacity.",
            "riskLevel": "HIGH",
            "projectedImpact": {
                "waitTimeChangeMinutes": 8,
                "doctorLoadChangePercentage": 17,
                "emergencyOccupancyPercentage": 75,
            },
            "bottlenecks": [
                "Emergency doctor workload approaching capacity",
                "No ICU bed available",
                "Only one cardiac monitor remains",
            ],
            "recommendedActions": [
                "Call backup emergency doctor",
                "Prepare inter-hospital transfer option",
                "Reserve remaining monitor for P1 cases",
            ],
        }
    )


@router.post("/api/recommendations/generate")
def generate_recommendation_alias(payload: dict):
    """Keep existing AI route shape available under frontend-friendly path."""
    from app.services.ai_service import generate_ai_recommendation

    return ok(generate_ai_recommendation(payload))
