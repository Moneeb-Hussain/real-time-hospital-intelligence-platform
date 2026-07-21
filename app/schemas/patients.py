from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


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
    symptoms: List[str] = Field(default_factory=list)
    vitals: Vitals
    consciousness: str  # ALERT, CONFUSED, UNCONSCIOUS
    gender: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    arrivalType: str
    complaint: str
    symptoms: List[str]
    vitals: dict
    consciousness: str
    urgency_score: Optional[int] = None
    priority: Optional[str] = None  # P1, P2, P3, P4
    triggered_rules: List[str] = Field(default_factory=list)
    status: str
    created_at: Optional[datetime] = None
