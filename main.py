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

# Import and mount routes
from app.routes.patient_routes import router
app.include_router(router, prefix="/api")

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
            "dashboard": "/api/dashboard"
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Server running on http://localhost:{port}")
    print(f"📊 Dashboard: http://localhost:{port}/api/dashboard")
    print(f"🏥 Health: http://localhost:{port}/api/health\n")
    uvicorn.run(app, host="0.0.0.0", port=port)