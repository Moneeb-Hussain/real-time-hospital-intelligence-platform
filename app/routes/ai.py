from fastapi import APIRouter
from app.services.ai_service import generate_ai_recommendation

router = APIRouter()

@router.post("/api/recommendations/generate")
def generate_recommendation(payload: dict):
    """
    Receives the backend payload and returns
    an AI recommendation.
    """

    recommendation = generate_ai_recommendation(payload)

    return {
        "success": True,
        "data": recommendation
    }