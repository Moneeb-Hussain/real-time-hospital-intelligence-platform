"""Read hospital resources from Supabase and map to frontend shapes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.database.supabase import get_supabase


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_resources() -> list[dict[str, Any]]:
    response = get_supabase().table("resources").select("*").execute()
    return response.data or []


def _initials(name: str) -> str:
    parts = [p for p in name.replace("Dr.", "").strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _unit_code_for_bed(row: dict[str, Any]) -> str:
    """Map DB unit / id prefixes to ICU | ER | CCU | WARD."""
    unit_text = f"{row.get('unit') or ''} {row.get('sub_type') or ''}".strip().lower()
    rid = str(row.get("id") or "").upper()

    if "icu" in unit_text or rid.startswith("ICU"):
        return "ICU"
    if "ccu" in unit_text or rid.startswith("CCU"):
        return "CCU"
    if (
        "ward" in unit_text
        or "obs" in unit_text
        or "general" in unit_text
        or rid.startswith("WARD")
        or rid.startswith("OBS")
    ):
        return "WARD"
    if "er" in unit_text or "emerg" in unit_text or rid.startswith("ER"):
        return "ER"
    return "ER"


def map_bed(row: dict[str, Any]) -> dict[str, Any]:
    unit_code = _unit_code_for_bed(row)
    available = bool(row.get("is_available", True))
    return {
        "id": str(row.get("id")),
        "unitId": f"unit-{unit_code.lower()}",
        "unitCode": unit_code,
        "label": row.get("name") or row.get("resource_name") or str(row.get("id")),
        "status": "available" if available else "occupied",
        "patientId": str(row["assigned_to"]) if row.get("assigned_to") else None,
        "occupiedSince": None if available else row.get("last_updated"),
    }


def map_doctor(row: dict[str, Any]) -> dict[str, Any]:
    workload = int(row.get("workload_count") or row.get("workload") or 0)
    available = bool(row.get("is_available", True))
    max_load = int(row.get("max_load") or 6)
    status = "available" if available and workload < max_load else ("busy" if available else "off_shift")
    name = row.get("name") or row.get("resource_name") or "Unknown Doctor"
    return {
        "id": str(row.get("id")),
        "name": name,
        "specialty": row.get("specialty") or row.get("unit") or row.get("sub_type") or "Emergency",
        "department": (row.get("unit") or row.get("sub_type") or "ER"),
        "onShift": available,
        "maxLoad": max_load,
        "currentLoad": workload,
        "status": status,
        "avatarInitials": _initials(name),
    }


def map_equipment(row: dict[str, Any]) -> dict[str, Any]:
    available = bool(row.get("is_available", True))
    return {
        "id": str(row.get("id")),
        "label": row.get("name") or row.get("resource_name") or "Equipment",
        "type": row.get("sub_type") or "equipment",
        "status": "available" if available else "occupied",
        "assignedPatientId": str(row["assigned_to"]) if row.get("assigned_to") else None,
        "department": (row.get("sub_type") or "ER").upper(),
    }


def _bed_bucket(beds: list[dict[str, Any]], unit_code: str) -> dict[str, Any]:
    unit_beds = [b for b in beds if b["unitCode"] == unit_code]
    available_beds = [b for b in unit_beds if b["status"] == "available"]
    total = len(unit_beds)
    available = len(available_beds)
    occupied = total - available
    occupancy = int((occupied / total) * 100) if total else 0
    return {
        "available": available,
        "total": total,
        "occupancyPct": occupancy,
        "availableBeds": available_beds,
        "allBeds": unit_beds,
    }


def _equipment_bucket(items: list[dict[str, Any]], type_key: str) -> dict[str, Any]:
    matched = [e for e in items if (e.get("type") or "").lower() == type_key.lower()]
    available_items = [e for e in matched if e["status"] == "available"]
    total = len(matched)
    available = len(available_items)
    occupied = total - available
    occupancy = int((occupied / total) * 100) if total else 0
    return {
        "available": available,
        "total": total,
        "occupancyPct": occupancy,
        "availableItems": available_items,
        "allItems": matched,
    }


def build_resources_inventory(rows: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Flat inventory for Resources page: real bed/equipment IDs + patient names."""
    rows = rows if rows is not None else fetch_resources()
    patient_names: dict[str, str] = {}
    try:
        res = get_supabase().table("patients").select("id,name").execute()
        patient_names = {
            str(p.get("id")): (p.get("name") or str(p.get("id")))
            for p in (res.data or [])
        }
    except Exception:
        pass

    beds: list[dict[str, Any]] = []
    doctors: list[dict[str, Any]] = []
    equipment: list[dict[str, Any]] = []

    for row in rows:
        rtype = row.get("resource_type")
        if rtype == "bed":
            bed = map_bed(row)
            pid = bed.get("patientId")
            beds.append(
                {
                    **bed,
                    "patientName": patient_names.get(str(pid)) if pid else None,
                }
            )
        elif rtype == "doctor":
            doctors.append(map_doctor(row))
        elif rtype == "equipment":
            eq = map_equipment(row)
            pid = eq.get("assignedPatientId")
            status = eq.get("status")
            if status == "occupied":
                status = "in_use"
            equipment.append(
                {
                    **eq,
                    "status": status,
                    "patientName": patient_names.get(str(pid)) if pid else None,
                    "typeLabel": str(eq.get("type") or "equipment")
                    .replace("_", " ")
                    .title(),
                }
            )

    beds.sort(key=lambda b: (b.get("unitCode") or "", b.get("id") or ""))
    doctors.sort(key=lambda d: d.get("name") or "")
    equipment.sort(key=lambda e: (e.get("type") or "", e.get("id") or ""))

    return {
        "timestamp": _now(),
        "beds": beds,
        "doctors": doctors,
        "equipment": equipment,
        "counts": {
            "bedsFree": sum(1 for b in beds if b.get("status") == "available"),
            "bedsTotal": len(beds),
            "doctorsAvailable": sum(1 for d in doctors if d.get("status") == "available"),
            "doctorsTotal": len(doctors),
            "equipmentFree": sum(1 for e in equipment if e.get("status") == "available"),
            "equipmentTotal": len(equipment),
        },
    }


def build_resources_summary(rows: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    rows = rows if rows is not None else fetch_resources()
    beds_raw = [r for r in rows if r.get("resource_type") == "bed"]
    doctors_raw = [r for r in rows if r.get("resource_type") == "doctor"]
    equipment_raw = [r for r in rows if r.get("resource_type") == "equipment"]

    beds = [map_bed(r) for r in beds_raw]
    doctors = [map_doctor(r) for r in doctors_raw]
    equipment = [map_equipment(r) for r in equipment_raw]

    icu = _bed_bucket(beds, "ICU")
    er = _bed_bucket(beds, "ER")
    ward = _bed_bucket(beds, "WARD")
    ccu = _bed_bucket(beds, "CCU")

    # If seeder only has ICU+ER, keep empty ward/ccu totals honest (0)
    available_doctors = [d for d in doctors if d["status"] == "available"]
    health = 100
    if icu["total"]:
        health -= max(0, icu["occupancyPct"] - 70) // 2
    if er["total"]:
        health -= max(0, er["occupancyPct"] - 70) // 3
    health = max(20, min(100, health))

    return {
        "timestamp": _now(),
        "beds": {
            "icu": icu,
            "er": er,
            "ward": {"available": ward["available"], "total": ward["total"], "occupancyPct": ward["occupancyPct"]},
            "ccu": {"available": ccu["available"], "total": ccu["total"], "occupancyPct": ccu["occupancyPct"]},
        },
        "doctors": {"available": available_doctors, "all": doctors},
        "equipment": {
            "cardiacMonitor": _equipment_bucket(equipment, "cardiac_monitor"),
            "ventilator": _equipment_bucket(equipment, "ventilator"),
            "ecgMachine": _equipment_bucket(equipment, "ecg"),
            "defibrillator": _equipment_bucket(equipment, "defibrillator"),
            "oxygenConc": _equipment_bucket(equipment, "oxygen_tank"),
        },
        "queue": {
            "p1Count": 0,
            "p2Count": 0,
            "p3Count": 0,
            "p4Count": 0,
            "avgWaitMinutes": 0,
            "longestWaitMinutes": 0,
        },
        "hospitalHealthScore": health,
    }


def enrich_summary_queue(
    summary: dict[str, Any],
    patients: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Fill snapshot.queue from live patient rows (waiting / registered / review)."""
    from datetime import datetime, timezone

    waiting_statuses = {"WAITING", "AWAITING_REVIEW", "REGISTERED"}
    waiting = [
        p
        for p in (patients or [])
        if str(p.get("status") or "").upper() in waiting_statuses
    ]
    counts = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}
    waits: list[float] = []
    now = datetime.now(timezone.utc)
    for p in waiting:
        pr = str(p.get("priority") or p.get("priority_level") or "P4").upper()
        if pr in counts:
            counts[pr] += 1
        raw = p.get("created_at") or p.get("arrivedAt")
        if not raw:
            continue
        try:
            text = str(raw).replace("Z", "+00:00")
            arrived = datetime.fromisoformat(text)
            if arrived.tzinfo is None:
                arrived = arrived.replace(tzinfo=timezone.utc)
            waits.append(max(0.0, (now - arrived).total_seconds() / 60.0))
        except Exception:
            continue

    summary = {**summary, "queue": {
        "p1Count": counts["P1"],
        "p2Count": counts["P2"],
        "p3Count": counts["P3"],
        "p4Count": counts["P4"],
        "avgWaitMinutes": int(round(sum(waits) / len(waits))) if waits else 0,
        "longestWaitMinutes": int(round(max(waits))) if waits else 0,
        "waitingTotal": len(waiting),
    }}
    return summary


def build_doctors_list(rows: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    rows = rows if rows is not None else fetch_resources()
    return [map_doctor(r) for r in rows if r.get("resource_type") == "doctor"]


def build_kpis_from_resources(rows: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    summary = build_resources_summary(rows)
    icu = summary["beds"]["icu"]
    doctors = summary["doctors"]["all"]
    available_doctors = summary["doctors"]["available"]
    beds = summary["beds"]
    bed_total = (
        beds["icu"]["total"]
        + beds["er"]["total"]
        + beds["ward"]["total"]
        + beds["ccu"]["total"]
    )
    bed_available = (
        beds["icu"]["available"]
        + beds["er"]["available"]
        + beds["ward"]["available"]
        + beds["ccu"]["available"]
    )
    bed_occupied = max(0, bed_total - bed_available)
    bed_occupancy_pct = int((bed_occupied / bed_total) * 100) if bed_total else 0
    return {
        "criticalPatients": 0,
        "criticalTrend": 0,
        "waitingPatients": 0,
        "waitingTrend": 0,
        "activePatients": 0,
        "icuBedsAvailable": icu["available"],
        "icuBedsTotal": icu["total"],
        "bedsTotal": bed_total,
        "bedsOccupied": bed_occupied,
        "bedOccupancyPct": bed_occupancy_pct,
        "doctorsAvailable": len(available_doctors),
        "doctorsTotal": len(doctors),
        "avgWaitMinutes": 0,
        "avgWaitTrend": 0,
        "pendingRecommendations": 0,
        "hospitalHealthScore": summary["hospitalHealthScore"],
    }


def build_live_dashboard_kpis(
    resource_rows: list[dict[str, Any]],
    patients: list[dict[str, Any]],
    pending_recommendations: int = 0,
) -> dict[str, Any]:
    """Compute KPI card metrics from live patients + resources."""
    from datetime import datetime, timezone

    kpis = build_kpis_from_resources(resource_rows)

    active_statuses = {"WAITING", "AWAITING_REVIEW", "REGISTERED", "ALLOCATED", "IN_TREATMENT"}
    waiting_statuses = {"WAITING", "AWAITING_REVIEW", "REGISTERED"}

    active = [
        p
        for p in patients
        if str(p.get("status") or "").upper() in active_statuses
    ]
    waiting = [
        p
        for p in patients
        if str(p.get("status") or "").upper() in waiting_statuses
    ]
    critical = [
        p
        for p in waiting
        if str(p.get("priority") or p.get("priority_level") or "") == "P1"
    ]

    now = datetime.now(timezone.utc)
    waits: list[float] = []
    for p in waiting:
        raw = p.get("created_at") or p.get("arrivedAt")
        if not raw:
            continue
        try:
            text = str(raw).replace("Z", "+00:00")
            arrived = datetime.fromisoformat(text)
            if arrived.tzinfo is None:
                arrived = arrived.replace(tzinfo=timezone.utc)
            waits.append(max(0.0, (now - arrived).total_seconds() / 60.0))
        except Exception:
            continue
    avg_wait = int(round(sum(waits) / len(waits))) if waits else 0

    # Capacity ring: active patients vs total bed capacity (cap 100)
    capacity = kpis["bedsTotal"] or 100
    active_pct = min(100, int(round((len(active) / capacity) * 100))) if capacity else 0

    kpis.update(
        {
            "activePatients": len(active),
            "activePatientsPct": active_pct,
            "criticalPatients": len(critical),
            "waitingPatients": len(waiting),
            "avgWaitMinutes": avg_wait,
            "pendingRecommendations": pending_recommendations,
            # Trends unknown without history — keep stable zeros for honest UI
            "criticalTrend": 0,
            "waitingTrend": 0,
            "avgWaitTrend": 0,
        }
    )
    return kpis


def build_department_status(rows: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    summary = build_resources_summary(rows)
    mapping = [
        ("ICU", "Intensive Care Unit", "icu"),
        ("ER", "Emergency Room", "er"),
        ("CCU", "Cardiac Care Unit", "ccu"),
        ("WARD", "General Ward", "ward"),
    ]
    result = []
    for code, name, key in mapping:
        bucket = summary["beds"][key]
        total = bucket["total"]
        available = bucket["available"]
        occupied = total - available
        pct = bucket["occupancyPct"]
        if pct >= 90:
            status = "critical"
        elif pct >= 75:
            status = "busy"
        elif total == 0:
            status = "normal"
        else:
            status = "normal"
        result.append(
            {
                "unitCode": code,
                "unitName": name,
                "totalBeds": total,
                "occupiedBeds": occupied,
                "occupancyPct": pct,
                "criticalPatients": 0,
                "status": status if total else "normal",
            }
        )
    return result
