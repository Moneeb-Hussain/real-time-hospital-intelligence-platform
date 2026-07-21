def calculate_urgency(patient_data):
    """
    Calculate urgency score (0-100) and P1-P4 level
    Based on: oxygen, BP, HR, chest pain, consciousness
    """
    score = 0
    reasons = []
    
    # Extract vitals (support both flat and nested)
    if 'vitals' in patient_data:
        vitals = patient_data['vitals']
        oxygen = vitals.get('oxygenSaturation', 100)
        heart_rate = vitals.get('heartRate', 80)
        systolic = vitals.get('systolicBP', 120)
        diastolic = vitals.get('diastolicBP', 80)
        temperature = vitals.get('temperature', 37)
    else:
        oxygen = patient_data.get('oxygen_level', 100)
        heart_rate = patient_data.get('heart_rate', 80)
        systolic = patient_data.get('blood_pressure_systolic', 120)
        diastolic = patient_data.get('blood_pressure_diastolic', 80)
        temperature = patient_data.get('temperature', 37)
    
    # Consciousness
    consciousness = patient_data.get('consciousness', 'ALERT')
    if consciousness == 'UNCONSCIOUS':
        score += 40
        reasons.append('Patient is unconscious')
    elif consciousness == 'CONFUSED':
        score += 20
        reasons.append('Patient is confused')
    
    # Oxygen (Critical: < 90%)
    if oxygen < 90:
        score += 30
        reasons.append(f'Critical oxygen level ({oxygen}%)')
    elif oxygen < 94:
        score += 15
        reasons.append(f'Low oxygen level ({oxygen}%)')
    
    # Blood Pressure (Critical: systolic < 90)
    if systolic < 90:
        score += 30
        reasons.append(f'Critical low blood pressure ({systolic}/{diastolic})')
    elif systolic < 100:
        score += 15
        reasons.append(f'Low blood pressure ({systolic}/{diastolic})')
    
    # Chest pain
    complaint = patient_data.get('complaint', '').lower()
    symptoms = ' '.join(patient_data.get('symptoms', [])).lower()
    if 'chest' in complaint or 'chest' in symptoms:
        score += 20
        reasons.append('Chest pain reported')
    
    # Heart Rate
    if heart_rate > 120:
        score += 15
        reasons.append(f'Tachycardia ({heart_rate} bpm)')
    elif heart_rate < 50:
        score += 15
        reasons.append(f'Bradycardia ({heart_rate} bpm)')
    
    # Fever (> 39°C)
    if temperature > 39:
        score += 10
        reasons.append(f'High fever ({temperature}°C)')
    
    # Elderly (> 75 years)
    if patient_data.get('age', 0) > 75:
        score += 10
        reasons.append(f'Elderly patient ({patient_data["age"]} years)')
    
    # Cap at 100
    final_score = min(score, 100)
    
    # P1-P4 Priority Levels
    if final_score >= 80:
        level = 'P1'
    elif final_score >= 60:
        level = 'P2'
    elif final_score >= 40:
        level = 'P3'
    else:
        level = 'P4'
    
    return {
        'score': final_score,
        'level': level,
        'reasons': reasons,
        'triggered_rules': reasons
    }