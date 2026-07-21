from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.database.supabase import supabase
from app.routes.patients import router
from app.routes.ai import router as ai_router
from app.routes.demo_api import router as demo_router
#
from app.routes.api_v1 import router as api_v1_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(demo_router)
# 2. Existing Routers
app.include_router(router)
app.include_router(ai_router)

# 3. NAYA API ROUTER MOUNT KARAIN (Priority 8 APIs)
app.include_router(api_v1_router)


@app.get("/")
def home():
    return {"message": "Hospital Backend is Running"}


# ----------------------------------------------------
# RESOURCE ENDPOINTS (Supabase-backed)
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


@app.post("/resources")
def create_resource(resource: ResourceSchema):
    try:
        response = supabase.table("resources").insert(resource.model_dump()).execute()
        return {"status": "success", "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/resources")
def get_all_resources():
    try:
        response = supabase.table("resources").select("*").execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/backend/validate-recommendation")
def validate_ai_recommendation(rec: AIRecommendationSchema):
    try:
        resource_query = (
            supabase.table("resources")
            .select("*")
            .eq("id", rec.recommended_resource_id)
            .execute()
        )

        if not resource_query.data:
            raise HTTPException(status_code=404, detail="Recommended resource does not exist.")

        resource = resource_query.data[0]

        if resource["is_available"] is True:
            return {
                "status": "approved",
                "message": f"Resource '{resource['resource_name']}' is available. Safe to proceed.",
                "alternative_plan_required": False,
            }

        return {
            "status": "flagged",
            "message": f"Conflict detected! '{resource['resource_name']}' is currently unavailable/occupied.",
            "alternative_plan_required": True,
            "alternative_action": (
                f"Stabilize patient in the emergency area and place them first in the "
                f"{rec.recommended_unit} waiting queue."
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))