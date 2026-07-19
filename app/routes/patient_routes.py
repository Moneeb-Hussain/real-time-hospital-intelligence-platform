from fastapi import APIRouter, HTTPException
from app.database.supabase import supabase
from app.services.priority_engine import calculate_urgency
from app.services.resource_checker import check_available_resources
from app.services.gpt_service import generate_recommendation

router = APIRouter()

@router.post("/patient")
async def process_patient(patient_data: dict):
    try:
        # Calculate urgency
        priority = calculate_urgency(patient_data)
        
        # Save patient
        patient_record = {
            **patient_data,
            'urgency_score': priority['score'],
            'priority_level': priority['level'],
            'status': 'waiting'
        }
        
        response = supabase.table('patients').insert(patient_record).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to save patient")
        
        # Check resources
        resources = await check_available_resources()
        
        # Get AI recommendation
        recommendation = await generate_recommendation(
            patient_data,
            priority,
            resources
        )
        
        return {
            "success": True,
            "patient": response.data[0],
            "priority": priority,
            "resources_available": resources,
            "recommendation": recommendation,
            "status": "pending_approval"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patient/approve")
async def approve_patient(approval_data: dict):
    try:
        patient_id = approval_data.get('patient_id')
        recommendation = approval_data.get('recommendation')
        
        if not patient_id:
            raise HTTPException(status_code=400, detail="Patient ID required")
        
        # Update patient
        response = supabase.table('patients').update({
            'hospital_area': recommendation.get('assigned_area'),
            'status': 'assigned'
        }).eq('id', patient_id).execute()
        
        return {
            "success": True,
            "message": "Patient approved",
            "patient": response.data[0] if response.data else None
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_dashboard():
    try:
        # Get waiting patients
        waiting_response = supabase.table('patients').select('*').eq('status', 'waiting').order('urgency_score', desc=True).execute()
        waiting_patients = waiting_response.data if waiting_response.data else []
        
        # Get critical patients
        critical_response = supabase.table('patients').select('*').eq('priority_level', 'P1').eq('status', 'waiting').execute()
        critical_patients = critical_response.data if critical_response.data else []
        
        # Get resources
        resources = await check_available_resources()
        
        return {
            "waitingPatients": waiting_patients,
            "criticalPatients": critical_patients,
            "resources": resources,
            "totalWaiting": len(waiting_patients)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {"status": "OK", "message": "System is healthy!"}