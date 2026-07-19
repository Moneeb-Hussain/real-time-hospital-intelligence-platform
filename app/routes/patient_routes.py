from fastapi import APIRouter
from app.schemas.patients import Patient
from app.services.patient_service import save_patient

router = APIRouter()

@router.post("/patient")
def add_patient(patient: Patient):
    result = save_patient(patient.dict())
    return {
        "message": "Patient Saved Successfully",
        "data": result.data
    }