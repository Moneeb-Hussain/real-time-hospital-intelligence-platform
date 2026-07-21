from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Vitals(BaseModel):
    heartRate: int
    oxygenSaturation: int
    systolicBP: int
    diastolicBP: int
    temperature: float

class PatientCreate(BaseModel):
    name: str
    age: int
    arrivalType: str  # AMBULANCE, WALK_IN, REFERRAL
    complaint: str
    symptoms: List[str] = []
    vitals: Vitals
    consciousness: str  # ALERT, CONFUSED, UNCONSCIOUS

class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    arrivalType: str
    complaint: str
    symptoms: List[str]
    vitals: dict
    consciousness: str
    urgency_score: int
    priority_level: str  # P1, P2, P3, P4
    triggered_rules: List[str]
    status: str
    created_at: datetime