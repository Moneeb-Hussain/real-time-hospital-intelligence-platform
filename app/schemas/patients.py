from pydantic import BaseModel

class Patient(BaseModel):
    name: str
    age: int
    symptoms: str
    heart_rate: int
    oxygen: int
    blood_pressure: str
    temperature: float
    conscious: bool