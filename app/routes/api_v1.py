from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.database.supabase import supabase
from app.services.priority_engine import calculate_urgency

router = APIRouter(prefix="/api", tags=["Spec APIs v1"])


class Vitals(BaseModel):
    heartRate: int
    oxygenSaturation: int
    systolicBP: int
    diastolicBP: int
    temperature: float


class PatientCreate(BaseModel):
    name: str
    age: int
    arrivalType: str = "WALK_IN"
    complaint: str
    symptoms: List[str] = Field(default_factory=list)
    vitals: Vitals
    consciousness: str = "ALERT"
    gender: Optional[str] = None


class BulkImport(BaseModel):
    patients: List[PatientCreate]


def _patient_row(patient: PatientCreate) -> dict:
    return {
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "arrival_type": patient.arrivalType,
        "complaint": patient.complaint,
        "symptoms": patient.symptoms,
        "vitals": patient.vitals.model_dump(),
        "consciousness": patient.consciousness.upper(),
        "status": "REGISTERED",
    }


class TriagePreviewBody(BaseModel):
    age: int = 30
    complaint: str = ""
    symptoms: List[str] = Field(default_factory=list)
    vitals: Vitals
    consciousness: str = "ALERT"


@router.post("/patients/preview-triage")
async def preview_triage(body: TriagePreviewBody):
    """Score a patient without writing to the database (intake live preview)."""
    priority = calculate_urgency(
        {
            "age": body.age,
            "complaint": body.complaint,
            "symptoms": body.symptoms or [],
            "consciousness": (body.consciousness or "ALERT").upper(),
            "vitals": body.vitals.model_dump(),
        }
    )
    return {
        "success": True,
        "data": {
            "score": priority["score"],
            "level": priority["level"],
            "reasons": priority.get("reasons") or [],
        },
    }


@router.post("/patients", status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate):
    try:
        res = supabase.table("patients").insert(_patient_row(patient)).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to insert patient into DB")
        row = res.data[0]
        return {
            "success": True,
            "data": {
                "patientId": str(row["id"]),
                "status": row.get("status", "REGISTERED"),
                "createdAt": row.get("created_at"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database insertion error: {str(e)}")


@router.post("/patients/import")
async def import_patients(payload: BulkImport):
    inserted_ids: list[str] = []
    failed = 0
    for patient in payload.patients:
        try:
            res = supabase.table("patients").insert(_patient_row(patient)).execute()
            if res.data:
                inserted_ids.append(str(res.data[0]["id"]))
            else:
                failed += 1
        except Exception:
            failed += 1
    return {
        "success": True,
        "data": {
            "imported": len(inserted_ids),
            "failed": failed,
            "patientIds": inserted_ids,
        },
    }


@router.post("/patients/{patient_id}/evaluate")
async def evaluate_patient(patient_id: str):
    try:
        patient_res = supabase.table("patients").select("*").eq("id", patient_id).execute()
        if not patient_res.data:
            raise HTTPException(status_code=404, detail="Patient not found")

        patient = patient_res.data[0]
        priority = calculate_urgency(
            {
                "age": patient.get("age"),
                "complaint": patient.get("complaint"),
                "symptoms": patient.get("symptoms") or [],
                "consciousness": patient.get("consciousness") or "ALERT",
                "vitals": patient.get("vitals") or {},
            }
        )

        update_res = (
            supabase.table("patients")
            .update(
                {
                    "urgency_score": priority["score"],
                    "priority": priority["level"],
                    "triggered_rules": priority.get("reasons") or [],
                    "status": "WAITING",
                }
            )
            .eq("id", patient_id)
            .execute()
        )

        try:
            supabase.table("audit_logs").insert(
                [
                    {
                        "patient_id": patient_id,
                        "action": "patient_arrived",
                        "description": f"{patient.get('name') or patient_id} registered through intake",
                        "actor": "INTAKE",
                        "meta": {"priority": priority["level"]},
                    },
                    {
                        "patient_id": patient_id,
                        "action": "priority_calculated",
                        "description": f"Assigned {priority['level']} (score {priority['score']})",
                        "actor": "RULE_ENGINE",
                        "meta": {
                            "priority": priority["level"],
                            "score": priority["score"],
                        },
                    },
                ]
            ).execute()
        except Exception:
            pass

        return {
            "success": True,
            "data": {
                "patientId": patient_id,
                "urgencyScore": priority["score"],
                "priority": priority["level"],
                "triggeredRules": priority.get("reasons") or [],
                "queuePosition": 1,
                "updatedPatient": (update_res.data or [None])[0],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


# Generate / validate / decision are owned by app.routes.ai (mounted first).


@router.get("/dashboard")
async def get_dashboard():
    try:
        patients_res = supabase.table("patients").select("*").execute()
        resources_res = supabase.table("resources").select("*").execute()
        try:
            alerts_res = supabase.table("alerts").select("*").eq("active", True).execute()
            alerts = alerts_res.data or []
        except Exception:
            alerts = []

        patients = patients_res.data or []
        resources = resources_res.data or []

        waiting = [
            p
            for p in patients
            if str(p.get("status") or "").upper()
            in {"WAITING", "AWAITING_REVIEW", "REGISTERED"}
        ]
        critical = [p for p in waiting if p.get("priority") == "P1"]
        beds = [r for r in resources if r.get("resource_type") == "bed"]
        icu = [
            b
            for b in beds
            if str(b.get("unit") or "").upper() == "ICU"
            or str(b.get("id", "")).startswith("ICU")
        ]
        er = [
            b
            for b in beds
            if "emergency" in str(b.get("unit") or "").lower()
            or str(b.get("id", "")).startswith("ER")
        ]

        def occ(group: list[dict]) -> int:
            if not group:
                return 0
            occupied = sum(1 for b in group if b.get("is_available") is not True)
            return int((occupied / len(group)) * 100)

        doctors_by_id = {
            str(r.get("id")): (r.get("name") or r.get("resource_name") or str(r.get("id")))
            for r in resources
            if r.get("resource_type") == "doctor"
        }

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
                    "assignedDoctorName": doctors_by_id.get(str(p.get("assigned_doctor_id") or "")),
                    "assignedBedId": p.get("assigned_bed_id"),
                }
                for p in waiting
            ],
            key=lambda item: item["urgencyScore"],
            reverse=True,
        )[:10]

        return {
            "success": True,
            "data": {
                "summary": {
                    "totalPatients": len(patients),
                    "waitingPatients": len(waiting),
                    "criticalPatients": len(critical),
                    "pendingApprovals": 0,
                    "averageWaitTimeMinutes": 0,
                },
                "occupancy": {
                    "icu": occ(icu),
                    "emergency": occ(er),
                    "observation": 0,
                },
                "alerts": [
                    {
                        "alertId": a.get("id"),
                        "severity": a.get("severity"),
                        "message": a.get("message"),
                    }
                    for a in alerts
                ],
                "queuePreview": queue_preview,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard aggregation failed: {str(e)}")


@router.post("/simulations")
async def run_simulation(config: dict):
    try:
        patients_res = supabase.table("patients").select("id, urgency_score, priority").execute()
        patient_count = len(patients_res.data or [])
        surge_factor = float(config.get("surge_factor", 1.5))
        projected_load = int(patient_count * surge_factor)
        return {
            "success": True,
            "data": {
                "simulationId": f"SIM-{projected_load}",
                "current_patient_count": patient_count,
                "projected_patient_load": projected_load,
                "status": "COMPLETED",
                "capacity_overflow_risk": projected_load > 50,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
