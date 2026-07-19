from fastapi import APIRouter, HTTPException
from app.schemas.patients import Patient
from app.services.patient_service import save_patient
from postgrest.exceptions import APIError
from app.database.supabase import supabase

router = APIRouter()

@router.post("/patients")
def create_patient(patient: Patient):
    try:
        response = save_patient(patient.model_dump())
        return {
            "message": "Patient Saved Successfully",
            "data": response.data
        }
    except APIError as e:
        # Agar Supabase koi error dega toh Swagger pe exact message dikhega
        raise HTTPException(status_code=400, detail=f"Supabase Error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))