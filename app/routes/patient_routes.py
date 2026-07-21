from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
from datetime import datetime
import uuid
import random
from app.database.supabase import supabase
from app.services.priority_engine import calculate_urgency
from app.services.resource_checker import check_available_resources
from app.services.gpt_service import generate_recommendation

router = APIRouter()

# ============================================================
# API 1: POST /api/patient - Add a single patient
# ============================================================
@router.post("/patient", status_code=status.HTTP_201_CREATED)
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
# API 2: POST /api/patients/import - Bulk import patients
# ============================================================
@router.post("/patients/import", status_code=status.HTTP_201_CREATED)
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
# API 3: POST /api/patients/{id}/evaluate - Rule engine (no GPT)
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
# API 4: POST /api/recommendations/generate - AI Recommendation
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
        
        # Get available resources
        resources = await check_available_resources()
        
        # Calculate priority
        priority = {
            'score': patient.get('urgency_score', 0),
            'level': patient.get('priority_level', 'P4'),
            'reasons': ['Patient requires evaluation']
        }
        
        # Get available ICU beds
        icu_beds_response = supabase.table('resources').select('*').eq('resource_type', 'bed').eq('sub_type', 'ICU').eq('is_available', True).execute()
        icu_beds = icu_beds_response.data if icu_beds_response.data else []
        
        # Get available ER beds
        er_beds_response = supabase.table('resources').select('*').eq('resource_type', 'bed').eq('sub_type', 'emergency').eq('is_available', True).execute()
        er_beds = er_beds_response.data if er_beds_response.data else []
        
        # Get available doctors (sorted by workload)
        doctors_response = supabase.table('resources').select('*').eq('resource_type', 'doctor').eq('is_available', True).order('workload').execute()
        doctors = doctors_response.data if doctors_response.data else []
        
        # Get available equipment
        equipment_response = supabase.table('resources').select('*').eq('resource_type', 'equipment').eq('is_available', True).execute()
        equipment = equipment_response.data if equipment_response.data else []
        
        # Decide based on priority
        is_critical = priority['level'] in ['P1', 'P2']
        recommended_unit = 'ICU' if is_critical and icu_beds else 'Emergency'
        
        # Choose bed
        recommended_bed = None
        if recommended_unit == 'ICU' and icu_beds:
            recommended_bed = icu_beds[0]
        elif er_beds:
            recommended_bed = er_beds[0]
        
        # Choose doctor (least workload)
        recommended_doctor = doctors[0] if doctors else None
        
        # Choose equipment
        recommended_equipment = equipment[:2] if equipment else []
        
        # Build reasoning
        reasoning = []
        if patient.get('oxygen_level', 100) < 90:
            reasoning.append(f"Critical oxygen level ({patient.get('oxygen_level')}%)")
        if patient.get('blood_pressure_systolic', 120) < 90:
            reasoning.append(f"Critical low blood pressure ({patient.get('blood_pressure_systolic')}/{patient.get('blood_pressure_diastolic')})")
        if not patient.get('is_conscious', True):
            reasoning.append("Patient is unconscious")
        if 'chest' in patient.get('main_problem', '').lower():
            reasoning.append("Chest pain reported")
        if patient.get('heart_rate', 80) > 120:
            reasoning.append(f"Tachycardia ({patient.get('heart_rate')} bpm)")
        elif patient.get('heart_rate', 80) < 50:
            reasoning.append(f"Bradycardia ({patient.get('heart_rate')} bpm)")
        if recommended_unit == 'ICU':
            reasoning.append(f"{len(icu_beds)} ICU bed(s) available")
        else:
            reasoning.append(f"{len(er_beds)} ER bed(s) available")
        if recommended_doctor:
            reasoning.append(f"Dr. {recommended_doctor.get('name', 'Available')} available")
        
        # Build alternative plan
        alternative_plan = None
        if recommended_unit == 'ICU' and not icu_beds:
            alternative_plan = "No ICU beds available. Stabilize in Emergency Room and place first in ICU transfer queue."
        elif not recommended_doctor:
            alternative_plan = "No doctors currently available. Alert nursing supervisor for reassignment."
        elif not recommended_equipment:
            alternative_plan = "Limited equipment available. Prioritize critical monitoring."
        else:
            alternative_plan = "Resources available. Proceed with recommended plan."
        
        # Build structured recommendation
        recommendation = {
            "recommendedUnit": recommended_unit,
            "recommendedBedId": recommended_bed.get('id') if recommended_bed else None,
            "recommendedBedName": recommended_bed.get('name') if recommended_bed else None,
            "recommendedDoctorId": recommended_doctor.get('id') if recommended_doctor else None,
            "recommendedDoctorName": recommended_doctor.get('name') if recommended_doctor else None,
            "recommendedEquipment": [e.get('name') for e in recommended_equipment],
            "recommendedEquipmentIds": [e.get('id') for e in recommended_equipment],
            "reasoningSummary": reasoning,
            "confidence": 0.92 if is_critical and recommended_bed else 0.80,
            "alternativePlan": alternative_plan,
            "priorityLevel": priority['level'],
            "urgencyScore": priority['score']
        }
        
        # Save to audit log
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
            "resources_available": {
                "icu_beds": len(icu_beds),
                "er_beds": len(er_beds),
                "available_doctors": len(doctors),
                "available_equipment": len(equipment)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 5: POST /api/recommendations/{id}/validate - Validate AI recommendation
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
        
        errors = []
        warnings = []
        
        # Validate bed availability
        recommended_bed_id = recommendation.get('recommendedBedId')
        if recommended_bed_id:
            bed_response = supabase.table('resources').select('*').eq('id', recommended_bed_id).eq('is_available', True).execute()
            if not bed_response.data:
                errors.append(f"Recommended bed {recommended_bed_id} is not available")
        else:
            warnings.append("No bed recommended")
        
        # Validate doctor availability
        recommended_doctor_id = recommendation.get('recommendedDoctorId')
        if recommended_doctor_id:
            doctor_response = supabase.table('resources').select('*').eq('id', recommended_doctor_id).eq('is_available', True).execute()
            if not doctor_response.data:
                errors.append(f"Recommended doctor {recommended_doctor_id} is not available")
        else:
            warnings.append("No doctor recommended")
        
        # Validate equipment
        recommended_equipment_ids = recommendation.get('recommendedEquipmentIds', [])
        for equip_id in recommended_equipment_ids:
            equip_response = supabase.table('resources').select('*').eq('id', equip_id).eq('is_available', True).execute()
            if not equip_response.data:
                errors.append(f"Equipment {equip_id} is not available")
        
        return {
            "isValid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "status": "approved" if len(errors) == 0 else "flagged"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 6: PATCH /api/recommendations/{id}/decision - Approve/reject/override
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
            recommended_bed_id = recommendation.get('recommendedBedId')
            if recommended_bed_id:
                supabase.table('resources').update({
                    'is_available': False,
                    'assigned_to': patient_id
                }).eq('id', recommended_bed_id).execute()
            
            # Allocate doctor
            recommended_doctor_id = recommendation.get('recommendedDoctorId')
            if recommended_doctor_id:
                doctor = supabase.table('resources').select('*').eq('id', recommended_doctor_id).execute()
                if doctor.data:
                    supabase.table('resources').update({
                        'workload': doctor.data[0].get('workload', 0) + 1
                    }).eq('id', recommended_doctor_id).execute()
            
            # Allocate equipment
            recommended_equipment_ids = recommendation.get('recommendedEquipmentIds', [])
            for equip_id in recommended_equipment_ids:
                supabase.table('resources').update({
                    'is_available': False,
                    'assigned_to': patient_id
                }).eq('id', equip_id).execute()
            
            # Update patient status
            supabase.table('patients').update({
                'status': 'assigned',
                'hospital_area': recommendation.get('recommendedUnit', 'Emergency'),
                'assigned_bed_id': recommended_bed_id,
                'assigned_doctor_id': recommended_doctor_id
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
# API 7: GET /api/dashboard - Live summary
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
# API 8: POST /api/simulations - Run simulations
# ============================================================
@router.post("/simulations")
async def run_simulation(simulation_data: dict):
    """Run a simulation of patient arrivals"""
    try:
        num_patients = simulation_data.get('num_patients', 10)
        patients = []
        
        symptoms_list = [
            ["chest pain", "shortness of breath"],
            ["headache", "dizziness"],
            ["fever", "cough"],
            ["abdominal pain", "nausea"],
            ["broken bone", "swelling"]
        ]
        
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
# API 9: PATCH /api/resources/{id} - Update resource availability
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
# GET /api/patients - Get all patients
# ============================================================
@router.get("/patients")
async def get_all_patients():
    """Get all patients"""
    try:
        response = supabase.table('patients').select('*').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET /api/patients/{id} - Get patient by ID
# ============================================================
@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get a specific patient by ID"""
    try:
        response = supabase.table('patients').select('*').eq('id', patient_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Health Check
# ============================================================
@router.get("/health")
async def health_check():
    return {"status": "OK", "message": "System is healthy!"}