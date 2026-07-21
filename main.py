from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ResourceSchema(BaseModel):
    resource_type: str
    sub_type: str
    name: str
    is_available: bool = True
    workload: Optional[int] = 0

class ResourceUpdateSchema(BaseModel):
    is_available: Optional[bool] = None
    assigned_to: Optional[str] = None
    workload: Optional[int] = None

class AIRecommendationSchema(BaseModel):
    patient_id: str
    recommended_resource_id: str
    recommended_unit: str

app = FastAPI(title="Hospital Intelligence Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root
@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "Hospital System is active!",
        "endpoints": {
            "health": "/health",
            "resources": "/resources",
            "validate": "/backend/validate-recommendation",
            "dashboard": "/api/dashboard"
        }
    }

# Health
@app.get("/health")
async def health():
    return {"status": "OK", "message": "System is healthy!"}

# Resources - GET all
@app.get("/resources")
def get_all_resources():
    try:
        response = supabase.table("resources").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resources - POST create
@app.post("/resources")
def create_resource(resource: ResourceSchema):
    try:
        response = supabase.table("resources").insert(resource.model_dump()).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resources - GET one
@app.get("/resources/{resource_id}")
def get_resource(resource_id: str):
    try:
        response = supabase.table("resources").select("*").eq("id", resource_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resources - PATCH update
@app.patch("/resources/{resource_id}")
def update_resource(resource_id: str, update_data: ResourceUpdateSchema):
    try:
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        response = supabase.table("resources").update(update_dict).eq("id", resource_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        return {"status": "success", "data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resources - DELETE
@app.delete("/resources/{resource_id}")
def delete_resource(resource_id: str):
    try:
        response = supabase.table("resources").delete().eq("id", resource_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        return {"status": "success", "message": f"Resource {resource_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Validate Recommendation
@app.post("/backend/validate-recommendation")
def validate_ai_recommendation(rec: AIRecommendationSchema):
    try:
        resource_query = supabase.table("resources").select("*").eq("id", rec.recommended_resource_id).execute()
        if not resource_query.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        resource = resource_query.data[0]
        if resource["is_available"] is True:
            return {
                "status": "approved",
                "message": f"Resource '{resource['name']}' is available.",
                "alternative_plan_required": False,
                "resource": resource
            }
        return {
            "status": "flagged",
            "message": f"Resource '{resource['name']}' is unavailable.",
            "alternative_plan_required": True,
            "alternative_action": f"Stabilize patient in emergency area and place in {rec.recommended_unit} queue.",
            "resource": resource
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ✅ DASHBOARD API - ADDED HERE
# ============================================================

@app.get("/api/dashboard")
def get_dashboard():
    try:
        resources_response = supabase.table("resources").select("*").execute()
        resources = resources_response.data if resources_response.data else []
        
        beds = [r for r in resources if r.get('resource_type') == 'bed']
        doctors = [r for r in resources if r.get('resource_type') == 'doctor']
        equipment = [r for r in resources if r.get('resource_type') == 'equipment']
        
        available_beds = [b for b in beds if b.get('is_available') == True]
        available_doctors = [d for d in doctors if d.get('is_available') == True]
        available_equipment = [e for e in equipment if e.get('is_available') == True]
        
        icu_beds = [b for b in beds if b.get('sub_type') == 'ICU']
        emergency_beds = [b for b in beds if b.get('sub_type') == 'emergency']
        
        return {
            "total_resources": len(resources),
            "beds": {
                "total": len(beds),
                "available": len(available_beds),
                "icu": len(icu_beds),
                "emergency": len(emergency_beds)
            },
            "doctors": {
                "total": len(doctors),
                "available": len(available_doctors)
            },
            "equipment": {
                "total": len(equipment),
                "available": len(available_equipment)
            },
            "timestamp": "2026-07-21T10:34:05.147669+00:00"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simulate Patients
@app.post("/api/simulate")
def simulate_patients():
    import random
    from datetime import datetime
    symptoms_list = [
        ["chest pain", "shortness of breath"],
        ["headache", "dizziness"],
        ["fever", "cough"],
        ["abdominal pain", "nausea"],
        ["broken bone", "swelling"]
    ]
    simulated = []
    for i in range(5):
        age = random.randint(18, 85)
        symptoms = random.choice(symptoms_list)
        simulated.append({
            "age": age,
            "main_problem": symptoms[0],
            "symptoms": symptoms,
            "heart_rate": random.randint(60, 140),
            "oxygen_level": random.randint(85, 100),
            "blood_pressure_systolic": random.randint(80, 180),
            "blood_pressure_diastolic": random.randint(50, 110),
            "temperature": round(random.uniform(36.0, 40.0), 1),
            "is_conscious": random.choice([True, True, True, False])
        })
    return {"status": "success", "message": "Simulated 5 patients", "patients": simulated}

# Import patient routes (optional)
try:
    from app.routes.patient_routes import router as patient_router
    app.include_router(patient_router, prefix="/api")
    print("✅ Patient routes loaded!")
except Exception as e:
    print(f"⚠️ Patient routes not loaded: {e}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Server running on http://localhost:{port}")
    print(f"📊 Resources: http://localhost:{port}/resources")
    print(f"📈 Dashboard: http://localhost:{port}/api/dashboard")
    print(f"🏥 Health: http://localhost:{port}/health\n")
    uvicorn.run(app, host="0.0.0.0", port=port)