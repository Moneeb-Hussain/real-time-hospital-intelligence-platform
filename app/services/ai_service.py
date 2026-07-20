import json

def generate_ai_recommendation(payload):
    """
    Generates a recommendation for the backend.
    Currently returns mock data.
    Later this function will call the OpenAI API.
    """

    recommendation = {
        "recommendedPriority": "P1",
        "recommendedQueuePosition": 1,
        "recommendedUnit": "Emergency Resuscitation",
        "recommendedBedId": "ER-02",
        "recommendedDoctorId": "D-01",
        "requiredEquipmentIds": [
            "MON-01"
        ],
        "immediateActions": [
            "Move patient to emergency resuscitation",
            "Assign emergency doctor",
            "Start continuous monitoring"
        ],
        "reasoningSummary": [
            "Patient has low oxygen saturation",
            "Patient reported severe chest pain",
            "Patient has the highest urgency score in the queue"
        ],
        "resourceConflicts": [
            "No ICU bed is currently available"
        ],
        "alternativePlan": {
            "unit": "Emergency Resuscitation",
            "actions": [
                "Stabilize patient in emergency",
                "Place patient first in ICU transfer queue",
                "Notify ICU coordinator"
            ]
        },
        "confidence": 0.93,
        "requiresHumanApproval": True
    }

    return recommendation