from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
import uuid
from app.database.supabase import supabase
from app.services.priority_engine import calculate_urgency
from app.services.resource_checker import check_available_resources
from app.services.gpt_service import generate_recommendation

router = APIRouter()

# ============================================================
# API 1: POST /api/patients - Add a single patient ✅ ALREADY BUILT
# ============================================================
@router.post("/patient")
async def process_patient(patient_data: dict):
    """Add a new patient with AI triage"""
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


# ============================================================
# API 2: POST /api/patients/import - Bulk import patients 🔴 NEW
# ============================================================
@router.post("/patients/import")
async def import_patients(patients_list: List[dict]):
    """Import multiple patients at once"""
    try:
        imported = []
        errors = []
        
        for idx, patient_data in enumerate(patients_list):
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
                
                if response.data:
                    imported.append({
                        "index": idx,
                        "patient": response.data[0],
                        "priority": priority
                    })
                else:
                    errors.append({"index": idx, "error": "Failed to save"})
                    
            except Exception as e:
                errors.append({"index": idx, "error": str(e)})
        
        return {
            "success": True,
            "total": len(patients_list),
            "imported": len(imported),
            "errors": len(errors),
            "data": imported,
            "error_details": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 3: POST /api/patients/{id}/evaluate - Rule engine (no GPT) 🔴 NEW
# ============================================================
@router.post("/patients/{patient_id}/evaluate")
async def evaluate_patient(patient_id: str):
    """Evaluate patient using rule engine only (no AI)"""
    try:
        # Get patient from database
        response = supabase.table('patients').select('*').eq('id', patient_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = response.data[0]
        
        # Calculate urgency (rule engine only)
        priority = calculate_urgency(patient)
        
        # Update patient
        supabase.table('patients').update({
            'urgency_score': priority['score'],
            'priority_level': priority['level']
        }).eq('id', patient_id).execute()
        
        return {
            "success": True,
            "patient_id": patient_id,
            "priority": priority,
            "method": "rule_engine_only"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 4: POST /api/recommendations/generate - Build payload from DB 🔴 NEW
# ============================================================
@router.post("/recommendations/generate")
async def generate_recommendation_api(patient_id: str = Query(...)):
    """Generate AI recommendation for a patient"""
    try:
        # Get patient from database
        patient_response = supabase.table('patients').select('*').eq('id', patient_id).execute()
        
        if not patient_response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = patient_response.data[0]
        
        # Get resources
        resources = await check_available_resources()
        
        # Calculate priority
        priority = {
            'score': patient.get('urgency_score', 0),
            'level': patient.get('priority_level', 'P4'),
            'reasons': ['Patient evaluation']
        }
        
        # Generate AI recommendation
        recommendation = await generate_recommendation(patient, priority, resources)
        
        # Save recommendation to audit log
        supabase.table('audit_logs').insert({
            'patient_id': patient_id,
            'action': 'recommendation_generated',
            'recommendation': recommendation,
            'status': 'pending'
        }).execute()
        
        return {
            "success": True,
            "patient_id": patient_id,
            "recommendation": recommendation,
            "resources_available": resources
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 5: POST /api/recommendations/{id}/validate - Validate AI recommendation 🔴 NEW
# ============================================================
@router.post("/recommendations/{recommendation_id}/validate")
async def validate_recommendation(recommendation_id: str):
    """Validate if AI recommendation is feasible"""
    try:
        # Get recommendation from audit log
        response = supabase.table('audit_logs').select('*').eq('id', recommendation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        audit = response.data[0]
        recommendation = audit.get('recommendation', {})
        
        # Validate bed availability
        assigned_area = recommendation.get('assigned_area', '')
        bed_type = 'ICU' if assigned_area == 'ICU' else 'emergency'
        
        beds_response = supabase.table('resources').select('*').eq('resource_type', 'bed').eq('sub_type', bed_type).eq('is_available', True).execute()
        bed_available = len(beds_response.data) > 0 if beds_response.data else False
        
        # Validate doctor availability
        doctors_response = supabase.table('resources').select('*').eq('resource_type', 'doctor').eq('is_available', True).execute()
        doctor_available = len(doctors_response.data) > 0 if doctors_response.data else False
        
        # Validate equipment
        equipment_needed = recommendation.get('required_resources', [])
        equipment_available = []
        for item in equipment_needed:
            equip_response = supabase.table('resources').select('*').eq('resource_type', 'equipment').eq('name', item).eq('is_available', True).execute()
            if equip_response.data and len(equip_response.data) > 0:
                equipment_available.append(item)
        
        validation_result = {
            "valid": bed_available and doctor_available,
            "bed_available": bed_available,
            "doctor_available": doctor_available,
            "equipment_available": equipment_available,
            "missing_equipment": [item for item in equipment_needed if item not in equipment_available]
        }
        
        # Update audit log
        supabase.table('audit_logs').update({
            'status': 'validated',
            'recommendation': {**recommendation, 'validation': validation_result}
        }).eq('id', recommendation_id).execute()
        
        return {
            "success": True,
            "recommendation_id": recommendation_id,
            "validation": validation_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 6: PATCH /api/recommendations/{id}/decision - Approve/reject/override 🔴 NEW
# ============================================================
@router.patch("/recommendations/{recommendation_id}/decision")
async def make_decision(recommendation_id: str, decision_data: dict):
    """Approve, reject, or override a recommendation"""
    try:
        decision = decision_data.get('decision')
        override_details = decision_data.get('override_details', {})
        
        if decision not in ['approved', 'rejected', 'overridden']:
            raise HTTPException(status_code=400, detail="Invalid decision")
        
        # Get recommendation
        response = supabase.table('audit_logs').select('*').eq('id', recommendation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        audit = response.data[0]
        patient_id = audit.get('patient_id')
        recommendation = audit.get('recommendation', {})
        
        # Update audit log
        supabase.table('audit_logs').update({
            'status': decision,
            'recommendation': {
                **recommendation,
                'decision': decision,
                'override_details': override_details if decision == 'overridden' else None
            }
        }).eq('id', recommendation_id).execute()
        
        # If approved, allocate resources
        if decision == 'approved':
            # Allocate bed
            assigned_area = recommendation.get('assigned_area', '')
            bed_type = 'ICU' if assigned_area == 'ICU' else 'emergency'
            
            bed = supabase.table('resources').select('*').eq('resource_type', 'bed').eq('sub_type', bed_type).eq('is_available', True).limit(1).execute()
            
            if bed.data:
                supabase.table('resources').update({
                    'is_available': False,
                    'assigned_to': patient_id
                }).eq('id', bed.data[0]['id']).execute()
            
            # Allocate doctor
            doctor = supabase.table('resources').select('*').eq('resource_type', 'doctor').eq('is_available', True).limit(1).execute()
            
            if doctor.data:
                supabase.table('resources').update({
                    'workload': doctor.data[0]['workload'] + 1
                }).eq('id', doctor.data[0]['id']).execute()
            
            # Update patient status
            supabase.table('patients').update({
                'status': 'assigned',
                'hospital_area': assigned_area
            }).eq('id', patient_id).execute()
        
        # If rejected, update patient status
        if decision == 'rejected':
            supabase.table('patients').update({
                'status': 'waiting'
            }).eq('id', patient_id).execute()
        
        return {
            "success": True,
            "recommendation_id": recommendation_id,
            "decision": decision,
            "patient_id": patient_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 7: GET /api/dashboard - Live summary ✅ ALREADY BUILT
# ============================================================
@router.get("/dashboard")
async def get_dashboard():
    """Get real-time hospital dashboard data"""
    try:
        # Get waiting patients
        waiting_response = supabase.table('patients').select('*').eq('status', 'waiting').order('urgency_score', desc=True).execute()
        waiting_patients = waiting_response.data if waiting_response.data else []
        
        # Get critical patients
        critical_response = supabase.table('patients').select('*').eq('priority_level', 'P1').eq('status', 'waiting').execute()
        critical_patients = critical_response.data if critical_response.data else []
        
        # Get resources
        resources = await check_available_resources()
        
        # Get recent audits
        audit_response = supabase.table('audit_logs').select('*').order('created_at', desc=True).limit(10).execute()
        recent_activity = audit_response.data if audit_response.data else []
        
        return {
            "waitingPatients": waiting_patients,
            "criticalPatients": critical_patients,
            "resources": resources,
            "recentActivity": recent_activity,
            "totalWaiting": len(waiting_patients),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 8: POST /api/simulations - Run simulations 🔴 NEW
# ============================================================
@router.post("/simulations")
async def run_simulation(simulation_data: dict):
    """Run a simulation of patient arrivals"""
    try:
        num_patients = simulation_data.get('num_patients', 10)
        patients = []
        
        # Generate random patients
        symptoms_list = [
            ["chest pain", "shortness of breath"],
            ["headache", "dizziness"],
            ["fever", "cough"],
            ["abdominal pain", "nausea"],
            ["broken bone", "swelling"]
        ]
        
        import random
        for i in range(num_patients):
            age = random.randint(18, 85)
            symptoms = random.choice(symptoms_list)
            heart_rate = random.randint(60, 140)
            oxygen_level = random.randint(85, 100)
            systolic = random.randint(80, 180)
            diastolic = random.randint(50, 110)
            temperature = round(random.uniform(36.0, 40.0), 1)
            is_conscious = random.choice([True, True, True, False])
            
            patient = {
                "age": age,
                "main_problem": symptoms[0],
                "symptoms": symptoms,
                "heart_rate": heart_rate,
                "oxygen_level": oxygen_level,
                "blood_pressure_systolic": systolic,
                "blood_pressure_diastolic": diastolic,
                "temperature": temperature,
                "is_conscious": is_conscious
            }
            
            # Process patient
            priority = calculate_urgency(patient)
            patient_record = {
                **patient,
                'urgency_score': priority['score'],
                'priority_level': priority['level'],
                'status': 'waiting'
            }
            response = supabase.table('patients').insert(patient_record).execute()
            if response.data:
                patients.append({
                    "patient": response.data[0],
                    "priority": priority
                })
        
        return {
            "success": True,
            "message": f"Created {len(patients)} simulated patients",
            "patients": patients
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 9: PATCH /api/resources/{id} - Update resource availability 🔴 NEW
# ============================================================
@router.patch("/resources/{resource_id}")
async def update_resource(resource_id: str, update_data: dict):
    """Update resource availability (for demo: mark ICU bed occupied)"""
    try:
        is_available = update_data.get('is_available')
        
        if is_available is None:
            raise HTTPException(status_code=400, detail="is_available field required")
        
        response = supabase.table('resources').update({
            'is_available': is_available,
            'last_updated': datetime.now().isoformat()
        }).eq('id', resource_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        return {
            "success": True,
            "resource": response.data[0],
            "message": f"Resource availability updated to {is_available}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Health Check - ✅ ALREADY BUILT
# ============================================================
@router.get("/health")
async def health_check():
    return {"status": "OK", "message": "System is healthy!"}