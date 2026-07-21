import os
import json
from app.database.supabase import supabase

async def generate_recommendation(patient_data, priority, resources):
    """Generate recommendation using rule-based logic (fallback if no AI)"""
    try:
        # This is a fallback recommendation without AI
        # You can replace this with actual OpenAI call later
        
        is_critical = priority.get('level') in ['P1', 'P2']
        
        # Determine unit
        if is_critical and resources.get('icu_beds', 0) > 0:
            unit = 'ICU'
        elif resources.get('emergency_beds', 0) > 0:
            unit = 'Emergency'
        else:
            unit = 'Observation'
        
        # Get available bed
        bed_response = supabase.table('resources').select('*').eq('resource_type', 'bed').eq('sub_type', unit if unit == 'ICU' else 'emergency').eq('is_available', True).limit(1).execute()
        bed = bed_response.data[0] if bed_response.data else None
        
        # Get available doctor
        doctor_response = supabase.table('resources').select('*').eq('resource_type', 'doctor').eq('is_available', True).order('workload').limit(1).execute()
        doctor = doctor_response.data[0] if doctor_response.data else None
        
        # Build reasoning
        reasoning = priority.get('reasons', ['Patient requires evaluation'])
        
        # Build alternative plan
        alternative_plan = None
        if is_critical and resources.get('icu_beds', 0) == 0:
            alternative_plan = "No ICU beds available. Stabilize in Emergency Room and place first in ICU transfer queue."
        elif not doctor:
            alternative_plan = "No doctors currently available. Alert nursing supervisor for reassignment."
        else:
            alternative_plan = "Resources available. Proceed with recommended plan."
        
        return {
            "action": f"Patient requires {'immediate' if is_critical else 'standard'} care in {unit}",
            "assigned_area": unit,
            "required_resources": [
                "Doctor",
                "Monitor"
            ],
            "reasoning": reasoning,
            "alternative_plan": alternative_plan,
            "confidence": 0.85
        }
        
    except Exception as e:
        print(f"Error generating recommendation: {e}")
        return {
            "action": "Stabilize patient in Emergency Room",
            "assigned_area": "Emergency",
            "required_resources": ["Doctor", "Monitor"],
            "reasoning": ["Patient requires immediate attention"],
            "alternative_plan": "Monitor vitals and reassess",
            "confidence": 0.70
        }