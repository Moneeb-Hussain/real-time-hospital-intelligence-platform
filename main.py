from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import uvicorn

from app.database.supabase import supabase
from app.routes.ai import router as ai_router
from app.routes.demo_api import router as demo_router
from app.routes.api_v1 import router as api_v1_router


app = FastAPI(title="AegisOps AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount AI routes first so they win on overlapping paths.
app.include_router(ai_router)
app.include_router(api_v1_router)
app.include_router(demo_router)


@app.get("/")
def home():
    return {"message": "Hospital Backend is Running"}


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
        if resource.get("is_available") is True:
            name = resource.get("resource_name") or resource.get("name") or "resource"
            return {
                "status": "approved",
                "message": f"Resource '{name}' is available. Safe to proceed.",
                "alternative_plan_required": False,
            }

        name = resource.get("resource_name") or resource.get("name") or "resource"
        return {
            "status": "flagged",
            "message": f"Conflict detected! '{name}' is currently unavailable/occupied.",
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


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Server running on http://localhost:{port}")
    # reload=True so new routes (e.g. /api/resources/inventory) pick up without a manual restart
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
