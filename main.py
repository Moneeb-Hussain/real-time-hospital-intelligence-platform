from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.supabase import supabase

from app.routes.patients import router

app = FastAPI()

app.include_router(router)

@app.get("/")
def home():
    return {"message": "Hospital Backend is Running"}

# ----------------------------------------------------
# 1. PYDANTIC SCHEMAS (Hamesha functions se bahar top par hone chahiye)
# ----------------------------------------------------
class ResourceSchema(BaseModel):
    resource_type: str
    resource_name: str
    unit: str
    is_available: Optional[bool] = True
    workload_count: Optional[int] = 0

class AIRecommendationSchema(BaseModel):
    patient_id: int
    recommended_resource_id: int
    recommended_unit: str

# ----------------------------------------------------
# 2. RESOURCE ENDPOINTS
# ----------------------------------------------------
@app.post("/resources")
def create_resource(resource: ResourceSchema):
    try:
        response = supabase.table("resources").insert(resource.dict()).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/resources")
def get_all_resources():
    try:
        response = supabase.table("resources").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# 3. AI RECOMMENDATION VALIDATOR ENDPOINT
# ----------------------------------------------------
@app.post("/backend/validate-recommendation")
def validate_ai_recommendation(rec: AIRecommendationSchema):
    try:
        # 1. Database se recommended resource ka live status check karo
        resource_query = supabase.table("resources").select("*").eq("id", rec.recommended_resource_id).execute()
        
        if not resource_query.data:
            raise HTTPException(status_code=404, detail="Recommended resource does not exist.")
        
        resource = resource_query.data[0]
        
        # 2. Verification Rule Check Karo
        if resource["is_available"] == True:
            return {
                "status": "approved",
                "message": f"Resource '{resource['resource_name']}' is available. Safe to proceed.",
                "alternative_plan_required": False
            }
        else:
            # 3. Alternative plan trigger karo agar resource occupied hai
            return {
                "status": "flagged",
                "message": f"Conflict detected! '{resource['resource_name']}' is currently unavailable/occupied.",
                "alternative_plan_required": True,
                "alternative_action": f"Stabilize patient in the emergency area and place them first in the {rec.recommended_unit} waiting queue."
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))