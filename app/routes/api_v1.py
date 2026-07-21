import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.database.supabase import supabase
 
def calculate_triage_score(patient: dict) -> int:
    """Calculates triage score based on patient vitals and condition."""
    vitals = patient.get("vitals", {}) or {}
    
    hr = vitals.get("hr") or vitals.get("heart_rate", 75)
    spo2 = vitals.get("spo2", 98)
    
    score = 50
    if spo2 < 90 or hr > 130:
        score += 40
    elif spo2 < 95 or hr > 100:
        score += 20
        
    return min(score, 100)
router = APIRouter(prefix="/api", tags=["Spec APIs v1"])

# --- SCHEMAS ---
class Vitals(BaseModel):
    hr: Optional[int] = None
    bp: Optional[str] = None
    spo2: Optional[int] = None
    temp: Optional[float] = None

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    arrivalType: Optional[str] = None
    complaint: Optional[str] = None
    consciousness: Optional[str] = None
    vitals: Optional[Vitals] = None

class DecisionRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    resource_id: Optional[str] = "res-icu"

# --- 1. POST /api/patients ---

# --- 1. POST /api/patients ---
@router.post("/patients", status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate):
    try:
        # Extract vitals safely
        v = patient.vitals if patient.vitals else None
        
        payload = {
            # "id": patient_id line YAHAN SE HATA DI HAI
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "arrivalType": patient.arrivalType or "Walk-in",
            "complaint": patient.complaint or "General",
            "consciousness": patient.consciousness or "Alert",
            "heartrate": v.hr if v else None,
            "bloodpressure": v.bp if v else None,
            "spo2": v.spo2 if v else None,
            "temperature": v.temp if v else None
        }

        res = supabase.table("patients").insert(payload).execute()
        
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to insert patient into DB")
            
        return {"success": True, "patient": res.data[0]}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database insertion error: {str(e)}")

# --- 2. POST /api/patients/import ---
@router.post("/patients")
async def create_patient(patient: PatientCreate):
    try:
        # Supabase Insert Operation
        data = supabase.table("patients").insert(patient.model_dump()).execute()
        return {"success": True, "data": data.data[0]}
    except Exception as e:
        # Silent fake response HATA DÍA! Real error bhejenge ab:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

# --- 3. POST /api/patients/{id}/evaluate ---
@router.post("/patients/{id}/evaluate")
async def evaluate_patient(id: str):
    try:
        # 1. Fetch patient from DB
        patient_res = supabase.table("patients").select("*").eq("id", id).execute()
        if not patient_res.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = patient_res.data[0]
        
        # 2. Logic / Rule engine evaluation
        triage_score = calculate_triage_score(patient) # aapka existing logic function
        priority = "High" if triage_score > 70 else "Medium"
        
        # 3. WRITE TO SUPABASE (Persistence)
        update_res = supabase.table("patients").update({
            "triage_score": triage_score,
            "priority": priority
        }).eq("id", id).execute()
        
        return {
            "success": True,
            "patient_id": id,
            "triage_score": triage_score,
            "priority": priority,
            "updated_patient": update_res.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
    # --- 4. POST /api/recommendations/generate ---
@router.post("/recommendations/generate")
async def generate_recommendation(data: dict):
    patient_id = data.get("patient_id")
    try:
        # Fetch patient from DB to ground recommendations in real context
        p_res = supabase.table("patients").select("*").eq("id", patient_id).execute()
        if not p_res.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = p_res.data[0]
        score = patient.get("triage_score", 50)
        
        # Real context-aware logic based on patient's triage score/priority
        plan = "Admit to ICU & initiate immediate continuous monitoring." if score > 70 else "Assign to Ward & re-evaluate in 4 hours."
        
        return {
            "success": True,
            "patient_id": patient_id,
            "recommendation": plan,
            "priority": patient.get("priority", "Medium")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

# --- 5. POST /api/recommendations/{id}/validate ---
@router.post("/recommendations/{id}/validate")
async def validate_recommendation(id: str):
    try:
        # Check actual beds/resources table in Supabase
        res = supabase.table("resources").select("*").execute()
        # Ensure available resources exist (e.g. available_beds > 0)
        available_beds = sum([r.get("available", 0) for r in res.data]) if res.data else 0
        
        is_valid = available_beds > 0
        return {
            "recommendation_id": id,
            "isValid": is_valid,
            "available_beds": available_beds,
            "message": "Resource capacity validated." if is_valid else "Insufficient beds/resources."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

# --- 6. PATCH /api/recommendations/{id}/decision ---
@router.patch("/recommendations/{id}/decision")
async def apply_decision(id: str, decision: dict):
    status = decision.get("status") # e.g. "APPROVED" or "REJECTED"
    try:
        # Update recommendation decision status in DB
        rec_res = supabase.table("recommendations").update({"status": status}).eq("id", id).execute()
        
        return {
            "success": True,
            "recommendation_id": id,
            "status": status,
            "data": rec_res.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision update failed: {str(e)}")

# --- 7. GET /api/dashboard ---
@router.get("/dashboard")
async def get_dashboard():
    try:
        # Fetch patients and resources directly from Supabase
        patients_res = supabase.table("patients").select("*").execute()
        resources_res = supabase.table("resources").select("*").execute()
        
        patients = patients_res.data or []
        resources = resources_res.data or []
        
        total_patients = len(patients)
        critical_patients = sum(1 for p in patients if p.get("priority") == "High" or (p.get("triage_score") or 0) > 70)
        
        return {
            "success": True,
            "metrics": {
                "total_patients": total_patients,
                "critical_patients": critical_patients,
                "stable_patients": total_patients - critical_patients,
                "resources": resources
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard aggregation failed: {str(e)}")

# --- 8. POST /api/simulations ---
@router.post("/simulations")
async def run_simulation(config: dict):
    try:
        # Run dynamic simulation based on current DB state
        patients_res = supabase.table("patients").select("id, triage_score, priority").execute()
        patient_count = len(patients_res.data or [])
        
        surge_factor = config.get("surge_factor", 1.5)
        projected_load = int(patient_count * surge_factor)
        
        return {
            "success": True,
            "simulation_id": "sim_" + str(projected_load),
            "current_patient_count": patient_count,
            "projected_patient_load": projected_load,
            "status": "COMPLETED",
            "capacity_overflow_risk": projected_load > 50  # adjust threshold as needed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")