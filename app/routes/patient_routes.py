from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
from datetime import datetime
import random
from app.database.supabase import supabase
from app.services.priority_engine import calculate_urgency
from app.services.resource_checker import check_available_resources

router = APIRouter()

# ============================================================
# API 1: POST /api/patients - Create ONE patient
# ============================================================
@router.post("/patient", status_code=status.HTTP_201_CREATED)
async def create_patient(patient_data: dict):
    try:
        priority = calculate_urgency(patient_data)
        patient_record = {
            **patient_data,
            'urgency_score': priority['score'],
            'priority_level': priority['level'],
            'triggered_rules': priority['reasons'],
            'status': 'WAITING',
            'created_at': datetime.now().isoformat()
        }
        response = supabase.table('patients').insert(patient_record).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to save patient")
        return {
            "success": True,
            "patient": response.data[0],
            "priority": {"score": priority['score'], "level": priority['level']},
            "triggered_rules": priority['reasons'],
            "status": "WAITING"
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 2: POST /api/patients/import - Import MULTIPLE patients
# ============================================================
@router.post("/patients/import", status_code=status.HTTP_201_CREATED)
async def import_patients(patients_list: List[dict]):
    try:
        imported = []
        errors = []
        for idx, patient_data in enumerate(patients_list):
            try:
                priority = calculate_urgency(patient_data)
                patient_record = {
                    **patient_data,
                    'urgency_score': priority['score'],
                    'priority_level': priority['level'],
                    'triggered_rules': priority['reasons'],
                    'status': 'WAITING',
                    'created_at': datetime.now().isoformat()
                }
                response = supabase.table('patients').insert(patient_record).execute()
                if response.data:
                    imported.append({"index": idx, "patient": response.data[0], "priority": priority})
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
# API 3: POST /api/patients/{id}/evaluate - Rule engine only
# ============================================================
@router.post("/patients/{patient_id}/evaluate")
async def evaluate_patient(patient_id: str):
    try:
        response = supabase.table('patients').select('*').eq('id', patient_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient = response.data[0]
        priority = calculate_urgency(patient)
        supabase.table('patients').update({
            'urgency_score': priority['score'],
            'priority_level': priority['level'],
            'triggered_rules': priority['reasons'],
            'status': 'WAITING'
        }).eq('id', patient_id).execute()
        return {
            "success": True,
            "patient_id": patient_id,
            "urgency_score": priority['score'],
            "priority_level": priority['level'],
            "triggered_rules": priority['reasons'],
            "status": "WAITING"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 4: POST /api/recommendations/validate - Validate recommendation
# ============================================================
@router.post("/recommendations/validate")
async def validate_recommendation(validation_data: dict):
    try:
        errors = []
        warnings = []
        recommended_bed_id = validation_data.get('recommended_bed_id')
        recommended_doctor_id = validation_data.get('recommended_doctor_id')
        if recommended_bed_id:
            bed_response = supabase.table('resources').select('*').eq('id', recommended_bed_id).eq('is_available', True).execute()
            if not bed_response.data:
                errors.append(f"Bed {recommended_bed_id} is not available")
        if recommended_doctor_id:
            doctor_response = supabase.table('resources').select('*').eq('id', recommended_doctor_id).eq('is_available', True).execute()
            if not doctor_response.data:
                errors.append(f"Doctor {recommended_doctor_id} is not available")
        return {
            "isValid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "status": "approved" if len(errors) == 0 else "flagged"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 5: POST /api/recommendations/decision - Allocate resources
# ============================================================
@router.post("/recommendations/decision")
async def make_decision(decision_data: dict):
    try:
        patient_id = decision_data.get('patient_id')
        decision = decision_data.get('decision')
        bed_id = decision_data.get('bed_id')
        doctor_id = decision_data.get('doctor_id')
        if decision != 'approved':
            return {"success": True, "decision": decision, "patient_id": patient_id}
        if bed_id:
            supabase.table('resources').update({
                'is_available': False,
                'assigned_to': patient_id
            }).eq('id', bed_id).execute()
        if doctor_id:
            doctor = supabase.table('resources').select('*').eq('id', doctor_id).execute()
            if doctor.data:
                supabase.table('resources').update({
                    'workload': doctor.data[0].get('workload', 0) + 1
                }).eq('id', doctor_id).execute()
        supabase.table('patients').update({'status': 'ASSIGNED'}).eq('id', patient_id).execute()
        return {
            "success": True,
            "decision": "approved",
            "patient_id": patient_id,
            "bed_allocated": bed_id,
            "doctor_allocated": doctor_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 6: GET /api/dashboard - Live dashboard
# ============================================================
@router.get("/dashboard")
async def get_dashboard():
    try:
        waiting_response = supabase.table('patients').select('*').eq('status', 'WAITING').order('urgency_score', desc=True).execute()
        waiting_patients = waiting_response.data if waiting_response.data else []
        resources_response = supabase.table('resources').select('*').execute()
        resources = resources_response.data if resources_response.data else []
        beds = [r for r in resources if r.get('resource_type') == 'bed']
        doctors = [r for r in resources if r.get('resource_type') == 'doctor']
        available_beds = [b for b in beds if b.get('is_available') == True]
        available_doctors = [d for d in doctors if d.get('is_available') == True]
        return {
            "waitingPatients": waiting_patients,
            "resources": {
                "total_beds": len(beds),
                "available_beds": len(available_beds),
                "total_doctors": len(doctors),
                "available_doctors": len(available_doctors)
            },
            "totalWaiting": len(waiting_patients),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 7: GET /api/patients - Get all patients
# ============================================================
@router.get("/patients")
async def get_all_patients():
    try:
        response = supabase.table('patients').select('*').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 8: GET /api/patients/{id} - Get patient by ID
# ============================================================
@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
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
# API 9: POST /api/recommendations/generate - Generate Recommendation
# ============================================================
@router.post("/recommendations/generate")
async def generate_recommendation_api(request_data: dict):
    try:
        patient_id = request_data.get('patientId')
        if not patient_id:
            raise HTTPException(status_code=400, detail="patientId is required")
        
        patient_response = supabase.table('patients').select('*').eq('id', patient_id).execute()
        if not patient_response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient = patient_response.data[0]
        
        resources_response = supabase.table('resources').select('*').eq('is_available', True).execute()
        resources = resources_response.data if resources_response.data else []
        
        icu_beds = [r for r in resources if r.get('resource_type') == 'bed' and r.get('sub_type') == 'ICU']
        emergency_beds = [r for r in resources if r.get('resource_type') == 'bed' and r.get('sub_type') == 'emergency']
        doctors = [r for r in resources if r.get('resource_type') == 'doctor']
        equipment = [r for r in resources if r.get('resource_type') == 'equipment']
        
        priority_level = patient.get('priority_level', 'P4')
        is_critical = priority_level in ['P1', 'P2']
        recommended_unit = 'ICU' if is_critical and icu_beds else ('Emergency' if emergency_beds else 'Observation')
        
        recommended_bed = None
        if recommended_unit == 'ICU' and icu_beds:
            recommended_bed = icu_beds[0]
        elif recommended_unit == 'Emergency' and emergency_beds:
            recommended_bed = emergency_beds[0]
        
        recommended_doctor = doctors[0] if doctors else None
        recommended_equipment = equipment[:2] if equipment else []
        
        reasoning_summary = []
        if patient.get('vitals'):
            vitals = patient.get('vitals', {})
            if vitals.get('oxygenSaturation', 100) < 90:
                reasoning_summary.append(f"Critical oxygen level ({vitals.get('oxygenSaturation')}%)")
            if vitals.get('systolicBP', 120) < 90:
                reasoning_summary.append(f"Critical low blood pressure ({vitals.get('systolicBP')}/{vitals.get('diastolicBP')})")
            if vitals.get('heartRate', 80) > 120:
                reasoning_summary.append(f"Tachycardia ({vitals.get('heartRate')} bpm)")
            if vitals.get('temperature', 37) > 39:
                reasoning_summary.append(f"High fever ({vitals.get('temperature')}°C)")
        if patient.get('consciousness') == 'UNCONSCIOUS':
            reasoning_summary.append("Patient is unconscious")
        if 'chest' in patient.get('complaint', '').lower():
            reasoning_summary.append("Chest pain reported")
        reasoning_summary.append(f"{len(icu_beds)} ICU beds available")
        reasoning_summary.append(f"{len(doctors)} doctors available")
        
        immediate_actions = []
        if 'chest' in patient.get('complaint', '').lower():
            immediate_actions.append("Start cardiac monitoring")
        if patient.get('vitals', {}).get('oxygenSaturation', 100) < 90:
            immediate_actions.append("Administer oxygen therapy")
        if patient.get('consciousness') == 'UNCONSCIOUS':
            immediate_actions.append("Check airway, breathing, circulation")
        if not immediate_actions:
            immediate_actions.append("Monitor vitals")
        
        resource_conflicts = []
        if is_critical and not icu_beds:
            resource_conflicts.append("No ICU beds available")
        if not doctors:
            resource_conflicts.append("No doctors available")
        
        alternative_plan = {
            "unit": recommended_unit if not resource_conflicts else "Observation",
            "actions": ["Continue monitoring", "Follow standard protocols"] if not resource_conflicts else [
                "Monitor vitals", "Reassess in 30 minutes", "Place first in ICU transfer queue"
            ]
        }
        
        recommendation_id = f"REC-{patient_id[:8].upper()}"
        recommendation = {
            "recommendationId": recommendation_id,
            "patientId": patient_id,
            "status": "PENDING_VALIDATION",
            "recommendation": {
                "recommendedPriority": priority_level,
                "recommendedUnit": recommended_unit,
                "recommendedBedId": recommended_bed.get('id') if recommended_bed else None,
                "recommendedDoctorId": recommended_doctor.get('id') if recommended_doctor else None,
                "requiredEquipmentIds": [e.get('id') for e in recommended_equipment],
                "immediateActions": immediate_actions,
                "reasoningSummary": reasoning_summary,
                "resourceConflicts": resource_conflicts,
                "alternativePlan": alternative_plan,
                "confidence": 0.90 if is_critical else 0.80,
                "requiresHumanApproval": True
            }
        }
        
        supabase.table('recommendations').insert({
            'patient_id': patient_id,
            'recommendation': recommendation,
            'status': 'PENDING_VALIDATION',
            'created_at': datetime.now().isoformat()
        }).execute()
        
        return recommendation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# API 10: GET /api/health - Health check
# ============================================================
@router.get("/health")
async def health_check():
    return {"status": "OK", "message": "System is healthy!"}