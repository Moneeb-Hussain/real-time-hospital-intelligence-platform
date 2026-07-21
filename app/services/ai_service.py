"""Resource-aware AI support for hospital operations.

The model is never used for diagnosis, medication, or treatment. The backend
still validates every returned resource ID and a human makes the final decision.
Provider order is OpenAI, Gemini Flash, Gemini Flash-Lite, then deterministic
logic. Each configured model is retried for transient or malformed responses.
"""

from __future__ import annotations

import json
import os
from typing import Any

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)
ALLOWED_PRIORITIES = {"P1", "P2", "P3", "P4"}
REQUIRED_RECOMMENDATION_FIELDS = (
    "recommendedPriority",
    "recommendedQueuePosition",
    "recommendedUnit",
    "recommendedBedId",
    "recommendedDoctorId",
    "requiredEquipmentIds",
    "immediateActions",
    "reasoningSummary",
    "resourceConflicts",
    "alternativePlan",
    "confidence",
    "requiresHumanApproval",
)

SYSTEM_PROMPT = """You are a hospital operations decision-support assistant.
Use only the patient, rule-engine, queue, and currently available resource data
provided by the backend.

You may recommend a queue position, hospital unit, bed, doctor, equipment,
immediate operational actions, and a resource-aware alternative plan.

Hard rules:
- Do not diagnose a disease.
- Do not prescribe medication or clinical treatment.
- Never invent a unit, bed, doctor, or equipment ID.
- Never choose a resource that is not in the available-resource lists.
- Respect the deterministic priority from ruleEngineResult.
- A P1 patient cannot be placed below a lower-priority stable patient.
- Never execute an allocation.
- requiresHumanApproval must always be true.
- Return strict JSON only, with no Markdown or commentary.
"""

RECOMMENDATION_SCHEMA: dict[str, Any] = {
    "name": "hospital_operational_recommendation",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "recommendedPriority",
            "recommendedQueuePosition",
            "recommendedUnit",
            "recommendedBedId",
            "recommendedDoctorId",
            "requiredEquipmentIds",
            "immediateActions",
            "reasoningSummary",
            "resourceConflicts",
            "alternativePlan",
            "confidence",
            "requiresHumanApproval",
        ],
        "properties": {
            "recommendedPriority": {"type": "string", "enum": ["P1", "P2", "P3", "P4"]},
            "recommendedQueuePosition": {"type": "integer", "minimum": 1},
            "recommendedUnit": {"type": "string"},
            "recommendedBedId": {"type": ["string", "null"]},
            "recommendedDoctorId": {"type": ["string", "null"]},
            "requiredEquipmentIds": {"type": "array", "items": {"type": "string"}},
            "immediateActions": {"type": "array", "items": {"type": "string"}},
            "reasoningSummary": {"type": "array", "items": {"type": "string"}},
            "resourceConflicts": {"type": "array", "items": {"type": "string"}},
            "alternativePlan": {
                "type": "object",
                "additionalProperties": False,
                "required": ["unit", "actions"],
                "properties": {
                    "unit": {"type": "string"},
                    "actions": {"type": "array", "items": {"type": "string"}},
                },
            },
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "requiresHumanApproval": {"type": "boolean"},
        },
    },
}


def generate_ai_recommendation(payload: dict[str, Any]) -> dict[str, Any]:
    """Generate the document's strict recommendation object."""
    context = _normalize_context(payload)
    try:
        result = _generate_with_provider_fallbacks(
            "Create one operational recommendation from this backend context.",
            context,
        )
        return _validate_and_normalize_recommendation(result, context)
    except Exception as exc:
        print(f"[ai_service] All configured LLMs failed; using rule fallback: {exc}")
        return _fallback_recommendation(context)


def generate_alternative_plan(
    payload: dict[str, Any], validation_errors: list[Any]
) -> dict[str, Any]:
    """Regenerate once after backend validation rejects an allocation."""
    context = _normalize_context(payload)
    context["validationErrors"] = validation_errors
    try:
        result = _generate_with_provider_fallbacks(
            "The previous plan failed backend validation. Create a different plan "
            "that avoids every validation error and uses only currently available resources.",
            context,
        )
        return _validate_and_normalize_recommendation(result, context)
    except Exception as exc:
        print(f"[ai_service] All alternative-plan LLMs failed; using rule fallback: {exc}")
        return _fallback_recommendation(context, validation_errors)


def generate_simulation_insights(
    scenario: dict[str, Any], resources: dict[str, Any]
) -> dict[str, Any]:
    """Predict operational impact from live capacity + what-if inputs (read-only)."""
    critical = _as_int(scenario.get("incomingCritical") or scenario.get("incoming_critical"))
    urgent = _as_int(scenario.get("incomingUrgent") or scenario.get("incoming_urgent"))
    needs_icu = _as_int(scenario.get("likelyNeedsICU") or scenario.get("likely_needs_icu"))
    needs_vent = _as_int(
        scenario.get("likelyNeedsVentilator") or scenario.get("likely_needs_ventilator")
    )
    needs_monitor = _as_int(
        scenario.get("likelyNeedsMonitor") or scenario.get("likely_needs_monitor")
    )
    window = max(
        10,
        _as_int(
            scenario.get("arrivalWindowMinutes") or scenario.get("arrival_window_minutes"),
            30,
        ),
    )

    beds = resources.get("beds", {}) or {}
    icu_available = _resource_count(resources, "beds", "icu")
    er_available = _resource_count(resources, "beds", "er")
    icu_occ = _as_int((beds.get("icu") or {}).get("occupancyPct"))
    er_occ = _as_int((beds.get("er") or {}).get("occupancyPct"))
    doctor_available = _doctor_count(resources)
    vent_available = _resource_count(resources, "equipment", "ventilator")
    monitor_available = _resource_count(resources, "equipment", "cardiacMonitor")

    queue = resources.get("queue", {}) or {}
    waiting_now = _as_int(queue.get("waitingTotal")) or (
        _as_int(queue.get("p1Count"))
        + _as_int(queue.get("p2Count"))
        + _as_int(queue.get("p3Count"))
        + _as_int(queue.get("p4Count"))
    )
    p1_now = _as_int(queue.get("p1Count"))
    avg_wait_now = _as_int(queue.get("avgWaitMinutes"))

    incoming = critical + urgent
    bottlenecks: list[str] = []
    if needs_icu > icu_available:
        bottlenecks.append(
            f"ICU bed shortage of {needs_icu - icu_available} "
            f"(need {needs_icu}, only {icu_available} free)"
        )
    if incoming > er_available + icu_available:
        bottlenecks.append(
            f"Bed capacity shortfall — {incoming} arrivals vs "
            f"{er_available + icu_available} free ER+ICU beds"
        )
    if incoming > doctor_available:
        bottlenecks.append(
            f"Doctor shortfall — {incoming} arrivals vs {doctor_available} available doctors"
        )
    if needs_vent > vent_available:
        bottlenecks.append(
            f"Ventilator shortage of {needs_vent - vent_available} "
            f"(need {needs_vent}, {vent_available} free)"
        )
    if needs_monitor > monitor_available:
        bottlenecks.append(
            f"Cardiac monitor shortage of {needs_monitor - monitor_available} "
            f"(need {needs_monitor}, {monitor_available} free)"
        )
    if p1_now + critical >= 3 and icu_available <= 1:
        bottlenecks.append("Existing P1 queue plus new critical arrivals will overwhelm ICU")

    # Risk from shortages + surge intensity relative to window
    surge_rate = incoming / (window / 60) if window else incoming  # per hour
    pressure = len(bottlenecks) + (1 if critical >= 3 else 0) + (1 if surge_rate >= 10 else 0)
    if pressure >= 4 or (needs_icu > icu_available and critical >= 3):
        risk = "CRITICAL"
    elif pressure >= 2:
        risk = "HIGH"
    elif pressure == 1:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    wait_delta = max(
        0,
        int(round(critical * 5 + urgent * 2.5 + waiting_now * 0.4 - doctor_available * 1.5)),
    )
    projected_avg_wait = avg_wait_now + wait_delta
    doctor_load_pct = min(
        100,
        int(round(((incoming + waiting_now) / max(1, doctor_available + waiting_now)) * 100)),
    )
    # Rough projected ER occupancy after absorbing arrivals into free beds
    er_total = _as_int((beds.get("er") or {}).get("total")) or 1
    er_free_after = max(0, er_available - max(0, incoming - needs_icu))
    er_occ_after = min(
        100,
        int(round(((er_total - er_free_after) / er_total) * 100)) if er_total else er_occ,
    )
    icu_total = _as_int((beds.get("icu") or {}).get("total")) or 1
    icu_free_after = max(0, icu_available - needs_icu)
    icu_occ_after = min(
        100,
        int(round(((icu_total - icu_free_after) / icu_total) * 100)) if icu_total else icu_occ,
    )

    actions: list[str] = []
    if incoming > doctor_available:
        actions.append("Call the backup emergency doctor onto shift")
    if needs_icu > icu_available:
        actions.extend(
            [
                "Prepare inter-hospital transfer options",
                "Prioritize the ICU transfer queue for P1 patients",
            ]
        )
    if needs_vent > vent_available:
        actions.append("Recall ventilators from maintenance if clinically safe")
    if needs_monitor > monitor_available:
        actions.append("Reserve remaining monitors for P1 patients only")
    if er_occ_after >= 85:
        actions.append("Open overflow ER observation bays")
    if not actions:
        actions.append("Continue monitoring capacity and staffing — surge is absorbable")

    summary = (
        f"In the next {window} minutes, {critical} P1 and {urgent} P2 arrivals "
        f"(+{incoming} total) against live capacity "
        f"({icu_available} ICU free, {er_available} ER free, {doctor_available} doctors, "
        f"{vent_available} vents, {monitor_available} monitors) "
        f"creates {risk} operational risk. "
        f"Queue today: {waiting_now} waiting ({p1_now} P1)."
    )

    return {
        "summary": summary,
        "riskLevel": risk,
        "baseline": {
            "icuAvailable": icu_available,
            "erAvailable": er_available,
            "doctorsAvailable": doctor_available,
            "ventilatorsAvailable": vent_available,
            "monitorsAvailable": monitor_available,
            "waitingNow": waiting_now,
            "p1Waiting": p1_now,
            "avgWaitMinutes": avg_wait_now,
            "icuOccupancyPct": icu_occ,
            "erOccupancyPct": er_occ,
        },
        "projectedImpact": {
            "waitTimeChangeMinutes": wait_delta,
            "projectedAvgWaitMinutes": projected_avg_wait,
            "doctorLoadChangePercentage": doctor_load_pct,
            "icuOccupancyPercentage": icu_occ_after,
            "emergencyOccupancyPercentage": er_occ_after,
            "additionalIcuBedsRequired": max(0, needs_icu - icu_available),
        },
        "bottlenecks": bottlenecks or ["No hard capacity bottlenecks detected for this scenario"],
        "recommendedActions": actions,
    }


def generate_briefing(
    requested_by: str,
    snapshot: dict[str, Any],
    alerts: list[dict[str, Any]],
    pending_recommendations: int = 0,
) -> dict[str, Any]:
    """Build an ops briefing from live snapshot + alerts (no LLM required)."""
    beds = snapshot.get("beds", {}) or {}
    icu = beds.get("icu", {}) or {}
    er = beds.get("er", {}) or {}
    ward = beds.get("ward", {}) or {}
    queue = snapshot.get("queue", {}) or {}
    doctors = snapshot.get("doctors", {}) or {}
    available_docs = doctors.get("available") or []
    all_docs = doctors.get("all") or []

    p1 = int(queue.get("p1Count") or 0)
    waiting_total = int(
        queue.get("waitingTotal")
        or (
            int(queue.get("p1Count") or 0)
            + int(queue.get("p2Count") or 0)
            + int(queue.get("p3Count") or 0)
            + int(queue.get("p4Count") or 0)
        )
    )
    avg_wait = int(queue.get("avgWaitMinutes") or 0)
    active_alerts = [a for a in alerts if a.get("active", True)]

    highlights: list[str] = [
        f"ICU occupancy is {icu.get('occupancyPct', 0)}% ({icu.get('available', 0)} of {icu.get('total', 0)} beds free)",
        f"ER occupancy is {er.get('occupancyPct', 0)}%",
        f"{p1} P1 patients waiting · {waiting_total} total in queue",
    ]
    if avg_wait:
        highlights.append(f"Average wait is {avg_wait} minutes")
    if pending_recommendations:
        highlights.append(f"{pending_recommendations} AI recommendations need approval")
    if all_docs:
        highlights.append(f"{len(available_docs)} of {len(all_docs)} doctors available")
    highlights.extend(str(a.get("message")) for a in active_alerts[:4] if a.get("message"))

    pressure: list[str] = []
    if int(icu.get("occupancyPct") or 0) >= 85:
        pressure.append("ICU under pressure")
    if p1 > 0:
        pressure.append(f"{p1} critical patient(s) still waiting")
    if avg_wait >= 30:
        pressure.append("wait times elevated")
    if not pressure:
        pressure.append("operations within normal range")

    briefing = (
        f"Hospital status briefing for {requested_by}: "
        f"{icu.get('available', 0)} ICU bed(s) available ({icu.get('occupancyPct', 0)}% occupied), "
        f"{er.get('available', 0)} ER bed(s) free, "
        f"Ward at {ward.get('occupancyPct', 0)}%. "
        f"{waiting_total} patients in queue ({p1} P1), "
        f"avg wait {avg_wait} min, "
        f"{len(active_alerts)} active alert(s), "
        f"{pending_recommendations} pending AI recommendation(s). "
        f"Overall: {', '.join(pressure)}."
    )

    return {
        "briefing": briefing,
        "highlights": highlights[:8],
    }


def generate_shift_report(
    shift_start: str,
    shift_end: str,
    snapshot: dict[str, Any],
    pending_recommendations: list[dict[str, Any]],
    alerts: list[dict[str, Any]],
) -> dict[str, Any]:
    """Generate the frontend handover contract from current operational state."""
    queue = snapshot.get("queue", {})
    pending = [
        f"Review recommendation {r.get('id', 'unknown')}"
        for r in pending_recommendations[:5]
    ]
    actions = [str(a.get("message")) for a in alerts[:3] if a.get("message")]
    if not actions:
        actions = ["Continue routine capacity monitoring"]
    return {
        "report": (
            f"Shift {shift_start} to {shift_end}: {queue.get('p1Count', 0)} P1 and "
            f"{queue.get('p2Count', 0)} P2 patients are waiting; "
            f"{len(pending_recommendations)} recommendations require review."
        ),
        "pendingItems": pending,
        "immediateActions": actions,
    }


COPILOT_SYSTEM_PROMPT = """You are the hospital operations AI Copilot.
Answer using only the live hospital snapshot provided by the backend.

Rules:
- Stay operational: capacity, queues, staffing, equipment, alerts, recommendations.
- Do not diagnose, prescribe, or give clinical treatment advice.
- Prefer short, clear answers with concrete numbers from the snapshot.
- If the snapshot lacks data for the question, say what is missing.
- Never invent resource IDs, patient IDs, or occupancy figures.
"""


def generate_copilot_reply(message: str, snapshot: dict[str, Any]) -> str:
    """Answer an operations question from the live hospital snapshot."""
    question = (message or "").strip()
    if not question:
        return "Ask a question about current hospital capacity, queues, staffing, or alerts."

    try:
        return _generate_copilot_with_providers(question, snapshot)
    except Exception as exc:
        print(f"[ai_service] Copilot LLM failed; using snapshot fallback: {exc}")
        return _fallback_copilot_reply(question, snapshot)


def _generate_copilot_with_providers(message: str, snapshot: dict[str, Any]) -> str:
    providers: list[tuple[str, str]] = []
    if os.getenv("OPENAI_API_KEY"):
        providers.append(("openai", os.getenv("OPENAI_MODEL", "gpt-4.1-mini")))
    if os.getenv("GEMINI_API_KEY"):
        providers.extend(
            [
                ("gemini", os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.5-flash")),
                (
                    "gemini",
                    os.getenv("GEMINI_SECONDARY_MODEL", "gemini-2.5-flash-lite"),
                ),
            ]
        )
    providers = list(dict.fromkeys(providers))
    if not providers:
        raise RuntimeError("No OpenAI or Gemini API key is configured")

    attempts = _llm_attempts()
    failures: list[str] = []
    for provider, model in providers:
        for attempt in range(1, attempts + 1):
            try:
                if provider == "openai":
                    return _call_openai_text(message, snapshot, model)
                return _call_gemini_text(message, snapshot, model)
            except Exception as exc:
                failure = (
                    f"{provider}/{model} attempt {attempt}/{attempts}: "
                    f"{type(exc).__name__}: {exc}"
                )
                failures.append(failure)
                print(f"[ai_service] {failure}")
    raise RuntimeError(" | ".join(failures))


def _call_openai_text(message: str, snapshot: dict[str, Any], model: str) -> str:
    from urllib.request import Request, urlopen

    request = Request(
        OPENAI_URL,
        headers={
            "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
            "Content-Type": "application/json",
        },
        data=json.dumps(
            {
                "model": model,
                "messages": [
                    {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Operator question: {message}\n\n"
                            f"Live hospital snapshot:\n"
                            f"{json.dumps(snapshot, default=str)}"
                        ),
                    },
                ],
                "temperature": 0.2,
            }
        ).encode("utf-8"),
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        response_data = json.loads(response.read().decode("utf-8"))
    content = response_data["choices"][0]["message"]["content"]
    text = str(content or "").strip()
    if not text:
        raise ValueError("OpenAI returned an empty copilot answer")
    return text


def _call_gemini_text(message: str, snapshot: dict[str, Any], model: str) -> str:
    from urllib.parse import quote
    from urllib.request import Request, urlopen

    api_key = os.environ["GEMINI_API_KEY"]
    url = GEMINI_URL.format(model=quote(model, safe=""))
    request = Request(
        url,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        data=json.dumps(
            {
                "system_instruction": {"parts": [{"text": COPILOT_SYSTEM_PROMPT}]},
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": (
                                    f"Operator question: {message}\n\n"
                                    f"Live hospital snapshot:\n"
                                    f"{json.dumps(snapshot, default=str)}"
                                )
                            }
                        ],
                    }
                ],
                "generationConfig": {"temperature": 0.2},
            }
        ).encode("utf-8"),
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        response_data = json.loads(response.read().decode("utf-8"))
    candidates = response_data.get("candidates") or []
    if not candidates:
        feedback = response_data.get("promptFeedback") or "No candidate returned"
        raise ValueError(f"Gemini returned no answer: {feedback}")
    parts = candidates[0].get("content", {}).get("parts") or []
    content = "".join(str(part.get("text") or "") for part in parts).strip()
    if not content:
        raise ValueError("Gemini returned an empty copilot answer")
    return content


def _fallback_copilot_reply(message: str, snapshot: dict[str, Any]) -> str:
    text = message.lower()
    beds = snapshot.get("beds") or {}
    icu = beds.get("icu") or {}
    er = beds.get("er") or {}
    queue = snapshot.get("queue") or {}
    doctors = snapshot.get("doctors") or {}
    alerts = snapshot.get("alerts") or []
    pending = snapshot.get("pendingRecommendations") or []
    doctor_list = doctors.get("all") or doctors.get("available") or []

    if "bottleneck" in text or "main issue" in text:
        bottlenecks = []
        if _as_int(icu.get("occupancyPct")) >= 85:
            bottlenecks.append(f"ICU near capacity ({icu.get('occupancyPct')}%)")
        if _as_int(er.get("occupancyPct")) >= 85:
            bottlenecks.append(f"ER near capacity ({er.get('occupancyPct')}%)")
        if _as_int(queue.get("p1Count")) > 0:
            bottlenecks.append(f"{queue.get('p1Count')} P1 patients waiting")
        if len(pending) > 0:
            bottlenecks.append(f"{len(pending)} recommendations awaiting review")
        if not bottlenecks:
            return (
                "No major bottleneck is visible in the current snapshot. "
                "Capacity and queue look manageable."
            )
        return "Main bottleneck(s): " + "; ".join(bottlenecks) + "."

    if "doctor" in text and ("workload" in text or "lowest" in text or "least" in text):
        if not doctor_list:
            return "No doctor workload data is available in the current snapshot."
        ranked = sorted(
            doctor_list,
            key=lambda d: (
                _as_int(d.get("currentLoad") or d.get("workload_count")),
                str(d.get("name") or ""),
            ),
        )
        top = ranked[0]
        return (
            f"{top.get('name') or top.get('id')} currently has the lowest workload "
            f"({_as_int(top.get('currentLoad') or top.get('workload_count'))}/"
            f"{_as_int(top.get('maxLoad') or top.get('max_load'), default=6)})."
        )

    if "icu" in text:
        return (
            f"ICU has {icu.get('available', 0)} of {icu.get('total', 0)} beds available "
            f"({icu.get('occupancyPct', 0)}% occupied)."
        )

    if "alert" in text:
        if not alerts:
            return "There are no active alerts right now."
        lines = [
            f"- [{a.get('severity') or 'INFO'}] {a.get('message')}"
            for a in alerts[:5]
            if a.get("message")
        ]
        return f"{len(alerts)} active alert(s):\n" + "\n".join(lines)

    if "queue" in text or "waiting" in text or "patient" in text:
        return (
            f"Waiting queue: P1={queue.get('p1Count', 0)}, "
            f"P2={queue.get('p2Count', 0)}, "
            f"P3={queue.get('p3Count', 0)}, "
            f"P4={queue.get('p4Count', 0)}."
        )

    return (
        f"Live snapshot: ICU {icu.get('available', 0)}/{icu.get('total', 0)} free, "
        f"ER {er.get('available', 0)}/{er.get('total', 0)} free, "
        f"{len(doctor_list)} doctors tracked, "
        f"{queue.get('p1Count', 0)} P1 waiting, "
        f"{len(alerts)} active alerts, "
        f"{len(pending)} pending recommendations."
    )


def _generate_with_provider_fallbacks(
    instruction: str, payload: dict[str, Any]
) -> dict[str, Any]:
    """Try each configured provider/model, retrying before moving to the next."""
    providers: list[tuple[str, str]] = []
    if os.getenv("OPENAI_API_KEY"):
        providers.append(("openai", os.getenv("OPENAI_MODEL", "gpt-4.1-mini")))
    if os.getenv("GEMINI_API_KEY"):
        providers.extend(
            [
                ("gemini", os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.5-flash")),
                (
                    "gemini",
                    os.getenv(
                        "GEMINI_SECONDARY_MODEL", "gemini-2.5-flash-lite"
                    ),
                ),
            ]
        )

    # Do not call the same provider/model twice if environment values match.
    providers = list(dict.fromkeys(providers))
    if not providers:
        raise RuntimeError("No OpenAI or Gemini API key is configured")

    attempts = _llm_attempts()
    failures: list[str] = []
    for provider, model in providers:
        for attempt in range(1, attempts + 1):
            try:
                if provider == "openai":
                    result = _call_openai_json(
                        instruction, payload, RECOMMENDATION_SCHEMA, model
                    )
                else:
                    result = _call_gemini_json(instruction, payload, model)
                _assert_complete_recommendation(result)
                print(
                    f"[ai_service] {provider}/{model} succeeded "
                    f"on attempt {attempt}/{attempts}"
                )
                return result
            except Exception as exc:
                failure = (
                    f"{provider}/{model} attempt {attempt}/{attempts}: "
                    f"{type(exc).__name__}: {exc}"
                )
                failures.append(failure)
                print(f"[ai_service] {failure}")

    raise RuntimeError(" | ".join(failures))


def _call_openai_json(
    instruction: str,
    payload: dict[str, Any],
    schema: dict[str, Any],
    model: str,
) -> dict[str, Any]:
    from urllib.request import Request, urlopen

    request = Request(
        OPENAI_URL,
        headers={
            "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
            "Content-Type": "application/json",
        },
        data=json.dumps(
            {
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"{instruction}\n\nBackend context:\n"
                            f"{json.dumps(payload, default=str)}"
                        ),
                    },
                ],
                "response_format": {"type": "json_schema", "json_schema": schema},
            }
        ).encode("utf-8"),
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        response_data = json.loads(response.read().decode("utf-8"))
    content = response_data["choices"][0]["message"]["content"]
    return _parse_json_response(content)


def _call_gemini_json(
    instruction: str, payload: dict[str, Any], model: str
) -> dict[str, Any]:
    from urllib.parse import quote
    from urllib.request import Request, urlopen

    api_key = os.environ["GEMINI_API_KEY"]
    url = GEMINI_URL.format(model=quote(model, safe=""))
    request = Request(
        url,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        data=json.dumps(
            {
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": (
                                    f"{instruction}\n\nBackend context:\n"
                                    f"{json.dumps(payload, default=str)}"
                                )
                            }
                        ],
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1,
                },
            }
        ).encode("utf-8"),
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        response_data = json.loads(response.read().decode("utf-8"))
    candidates = response_data.get("candidates") or []
    if not candidates:
        feedback = response_data.get("promptFeedback") or "No candidate returned"
        raise ValueError(f"Gemini returned no answer: {feedback}")
    parts = candidates[0].get("content", {}).get("parts") or []
    content = "".join(str(part.get("text") or "") for part in parts).strip()
    if not content:
        raise ValueError("Gemini returned an empty answer")
    return _parse_json_response(content)


def _parse_json_response(content: Any) -> dict[str, Any]:
    if not isinstance(content, str) or not content.strip():
        raise ValueError("LLM returned an empty answer")
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    result = json.loads(text)
    if not isinstance(result, dict):
        raise ValueError("LLM response must be a JSON object")
    return result


def _assert_complete_recommendation(result: dict[str, Any]) -> None:
    missing = [field for field in REQUIRED_RECOMMENDATION_FIELDS if field not in result]
    if missing:
        raise ValueError(f"LLM response is missing required fields: {', '.join(missing)}")
    if result.get("requiresHumanApproval") is not True:
        raise ValueError("LLM response must require human approval")


def _llm_attempts() -> int:
    try:
        value = int(os.getenv("LLM_MAX_ATTEMPTS", "2"))
    except ValueError:
        value = 2
    return max(1, min(value, 5))


def _normalize_context(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("AI payload must be a JSON object")
    return {
        "patient": payload.get("patient") or {},
        "ruleEngineResult": payload.get("ruleEngineResult") or {},
        "resources": payload.get("resources") or {},
        "currentQueue": payload.get("currentQueue") or [],
    }


def _validate_and_normalize_recommendation(
    recommendation: dict[str, Any], context: dict[str, Any]
) -> dict[str, Any]:
    resources = context["resources"]
    beds = resources.get("availableBeds") or []
    doctors = resources.get("availableDoctors") or []
    equipment = resources.get("availableEquipment") or []
    bed_ids = {_id(item, "bedId") for item in beds}
    doctor_ids = {_id(item, "doctorId") for item in doctors}
    equipment_ids = {_id(item, "equipmentId") for item in equipment}
    conflicts = [str(x) for x in recommendation.get("resourceConflicts", [])]

    bed_id = recommendation.get("recommendedBedId")
    if bed_id not in bed_ids:
        if bed_id:
            conflicts.append(f"Bed {bed_id} was not present in available resources")
        bed_id = None

    doctor_id = recommendation.get("recommendedDoctorId")
    if doctor_id not in doctor_ids:
        if doctor_id:
            conflicts.append(f"Doctor {doctor_id} was not present in available resources")
        doctor_id = None

    selected_equipment = [
        item
        for item in recommendation.get("requiredEquipmentIds", [])
        if item in equipment_ids
    ]
    priority = context["ruleEngineResult"].get("priority", "P3")
    if priority not in ALLOWED_PRIORITIES:
        priority = "P3"
    confidence = max(0.0, min(1.0, float(recommendation.get("confidence", 0.75))))
    alternative = recommendation.get("alternativePlan") or {}

    return {
        "recommendedPriority": priority,
        "recommendedQueuePosition": max(
            1, _as_int(recommendation.get("recommendedQueuePosition"), default=1)
        ),
        "recommendedUnit": str(
            recommendation.get("recommendedUnit") or _unit_for_bed(beds, bed_id)
        ),
        "recommendedBedId": bed_id,
        "recommendedDoctorId": doctor_id,
        "requiredEquipmentIds": selected_equipment,
        "immediateActions": [str(x) for x in recommendation.get("immediateActions", [])],
        "reasoningSummary": [str(x) for x in recommendation.get("reasoningSummary", [])],
        "resourceConflicts": list(dict.fromkeys(conflicts)),
        "alternativePlan": {
            "unit": str(alternative.get("unit") or "Emergency Resuscitation"),
            "actions": [str(x) for x in alternative.get("actions", [])],
        },
        "confidence": confidence,
        "requiresHumanApproval": True,
    }


def _fallback_recommendation(
    context: dict[str, Any], validation_errors: list[Any] | None = None
) -> dict[str, Any]:
    rule = context["ruleEngineResult"]
    resources = context["resources"]
    priority = rule.get("priority", "P3")
    if priority not in ALLOWED_PRIORITIES:
        priority = "P3"
    critical = priority in {"P1", "P2"}
    beds = resources.get("availableBeds") or []
    doctors = resources.get("availableDoctors") or []
    equipment = resources.get("availableEquipment") or []
    icu_available = _as_int(resources.get("icuBedsAvailable"))

    preferred_beds = [
        bed for bed in beds if "icu" in str(bed.get("unit", "")).lower()
    ] if critical and icu_available else [
        bed for bed in beds if any(
            name in str(bed.get("unit", "")).lower()
            for name in ("emergency", "er", "resuscitation")
        )
    ]
    bed = (preferred_beds or beds or [None])[0]
    doctor = min(doctors, key=lambda d: _as_int(d.get("currentLoad"))) if doctors else None
    monitor = next(
        (
            item
            for item in equipment
            if "monitor" in str(item.get("name") or item.get("type") or "").lower()
        ),
        None,
    )
    chosen_equipment = [monitor] if monitor else equipment[:1]
    unit = _value(bed, "unit") or "Emergency Resuscitation"

    conflicts: list[str] = []
    if critical and not icu_available:
        conflicts.append("No ICU bed is currently available")
    if not bed:
        conflicts.append("No bed is currently available")
    if not doctor:
        conflicts.append("No doctor is currently available")
    conflicts.extend(_validation_error_message(error) for error in validation_errors or [])

    reasons = rule.get("triggeredRules") or rule.get("reasons") or [
        f"Rule engine assigned {priority} priority"
    ]
    return {
        "recommendedPriority": priority,
        "recommendedQueuePosition": 1 if critical else _queue_position(context),
        "recommendedUnit": unit,
        "recommendedBedId": _id(bed, "bedId"),
        "recommendedDoctorId": _id(doctor, "doctorId"),
        "requiredEquipmentIds": [
            resource_id
            for resource_id in (_id(item, "equipmentId") for item in chosen_equipment)
            if resource_id
        ],
        "immediateActions": [
            f"Move patient to {unit}",
            "Assign the available hospital operator-approved resources",
            "Begin operational monitoring",
        ],
        "reasoningSummary": [str(reason) for reason in reasons],
        "resourceConflicts": list(dict.fromkeys(conflicts)),
        "alternativePlan": {
            "unit": "Emergency Resuscitation",
            "actions": [
                "Stabilize patient in emergency",
                "Place patient first in the ICU transfer queue",
                "Notify the ICU coordinator",
            ],
        },
        "confidence": 0.65,
        "requiresHumanApproval": True,
    }


def _queue_position(context: dict[str, Any]) -> int:
    priority = context["ruleEngineResult"].get("priority", "P3")
    rank = {"P1": 1, "P2": 2, "P3": 3, "P4": 4}.get(priority, 3)
    ahead = sum(
        1
        for item in context["currentQueue"]
        if {"P1": 1, "P2": 2, "P3": 3, "P4": 4}.get(item.get("priority"), 4) <= rank
    )
    return ahead + 1


def _id(item: dict[str, Any] | None, preferred: str) -> str | None:
    if not item:
        return None
    value = item.get(preferred) or item.get("id")
    return str(value) if value is not None else None


def _value(item: dict[str, Any] | None, key: str) -> Any:
    return item.get(key) if item else None


def _unit_for_bed(beds: list[dict[str, Any]], bed_id: str | None) -> str:
    for bed in beds:
        if _id(bed, "bedId") == bed_id:
            return str(bed.get("unit") or "Emergency Resuscitation")
    return "Emergency Resuscitation"


def _validation_error_message(error: Any) -> str:
    if isinstance(error, dict):
        return str(error.get("message") or error.get("code") or "Validation failed")
    return str(error).replace("_", " ").title()


def _as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _resource_count(resources: dict[str, Any], group: str, key: str) -> int:
    bucket = resources.get(group, {}).get(key, {})
    if isinstance(bucket, dict):
        return _as_int(bucket.get("available"))
    return _as_int(bucket)


def _doctor_count(resources: dict[str, Any]) -> int:
    doctors = resources.get("doctors", {})
    if isinstance(doctors, dict):
        available = doctors.get("available", [])
        return len(available) if isinstance(available, list) else _as_int(available)
    return _as_int(resources.get("availableDoctors"))