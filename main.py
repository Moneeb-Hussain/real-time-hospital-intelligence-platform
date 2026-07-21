from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

app = FastAPI(title="Hospital Intelligence Platform", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mount authoritative AI routes before legacy/demo routes with overlapping paths.
app.include_router(ai_router)

# Existing spec, demo, and patient routes.
app.include_router(api_v1_router)
app.include_router(demo_router)
app.include_router(router)
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

# ============================================================
# DIRECT ROUTES (BEFORE MOUNTING)
# ============================================================

@app.get("/resources")
async def get_resources():
    """Get all resources directly"""
    try:
        response = supabase.table('resources').select('*').execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}

# ============================================================
# MOUNT PATIENT ROUTES
# ============================================================

from app.routes.patient_routes import router
app.include_router(router, prefix="/api")

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "Hospital System is active!",
        "endpoints": {
            "health": "/api/health",
            "patients": "/api/patients",
            "patients_import": "/api/patients/import",
            "evaluate": "/api/patients/{id}/evaluate",
            "generate": "/api/recommendations/generate",
            "validate": "/api/recommendations/validate",
            "decision": "/api/recommendations/decision",
            "dashboard": "/api/dashboard",
            "resources": "/resources"
        }
    }

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Server running on http://localhost:{port}")
    print(f"📊 Dashboard: http://localhost:{port}/api/dashboard")
    print(f"🏥 Health: http://localhost:{port}/api/health")
    print(f"📦 Resources: http://localhost:{port}/resources\n")
    uvicorn.run(app, host="0.0.0.0", port=port)