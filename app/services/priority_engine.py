def calculate_urgency(patient_data):
    """Calculate urgency score (0-100) and P1-P4 level"""
    score = 0
    reasons = []
    
    # Rule 1: Very low oxygen (< 90%)
    oxygen = patient_data.get('oxygen_level', 0)
    if oxygen < 90:
        score += 30
        reasons.append('Critical oxygen level (below 90%)')
    elif oxygen < 94:
        score += 15
        reasons.append('Low oxygen level (below 94%)')
    
    # Rule 2: Very low blood pressure (systolic < 90)
    systolic = patient_data.get('blood_pressure_systolic', 0)
    if systolic < 90:
        score += 30
        reasons.append('Critical low blood pressure')
    elif systolic < 100:
        score += 15
        reasons.append('Low blood pressure')
    
    # Rule 3: Unconscious patient
    if not patient_data.get('is_conscious', True):
        score += 40
        reasons.append('Patient unconscious')
    
    # Rule 4: Chest pain
    problem = patient_data.get('main_problem', '').lower()
    if 'chest' in problem:
        score += 20
        reasons.append('Chest pain reported')
    
    # Rule 5: Abnormal heart rate
    heart_rate = patient_data.get('heart_rate', 80)
    if heart_rate > 120:
        score += 15
        reasons.append('Tachycardia')
    elif heart_rate < 50:
        score += 15
        reasons.append('Bradycardia')
    
    # Rule 6: High fever (> 39°C)
    temp = patient_data.get('temperature', 37)
    if temp > 39:
        score += 10
        reasons.append('High fever')
    
    # Rule 7: Elderly (> 75 years)
    age = patient_data.get('age', 50)
    if age > 75:
        score += 10
        reasons.append('Elderly patient')
    
    # Cap at 100
    final_score = min(score, 100)
    
    # Determine priority level
    if final_score >= 80:
        level = 'P1'  # Critical
    elif final_score >= 60:
        level = 'P2'  # Urgent
    elif final_score >= 40:
        level = 'P3'  # Moderate
    else:
        level = 'P4'  # Stable
    
    return {
        'score': final_score,
        'level': level,
        'reasons': reasons
    }