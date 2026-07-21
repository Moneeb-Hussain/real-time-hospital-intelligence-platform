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


def map_bed(row: dict[str, Any]) -> dict[str, Any]:
    unit = row.get("unit") or row.get("sub_type") or "ER"
    unit_text = str(unit)
    if "icu" in unit_text.lower() or str(row.get("id", "")).upper().startswith("ICU"):
        unit_code = "ICU"
    elif "obs" in unit_text.lower():
        unit_code = "WARD"
    elif "ccu" in unit_text.lower():
        unit_code = "CCU"
    else:
        unit_code = "ER"
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
        "department": (row.get("unit") or row.get("sub_type") or "ER").upper(),
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


def build_doctors_list(rows: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    rows = rows if rows is not None else fetch_resources()
    return [map_doctor(r) for r in rows if r.get("resource_type") == "doctor"]


def build_kpis_from_resources(rows: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    summary = build_resources_summary(rows)
    icu = summary["beds"]["icu"]
    doctors = summary["doctors"]["all"]
    available_doctors = summary["doctors"]["available"]
    return {
        "criticalPatients": 0,
        "criticalTrend": 0,
        "waitingPatients": 0,
        "waitingTrend": 0,
        "icuBedsAvailable": icu["available"],
        "icuBedsTotal": icu["total"],
        "doctorsAvailable": len(available_doctors),
        "doctorsTotal": len(doctors),
        "avgWaitMinutes": 0,
        "avgWaitTrend": 0,
        "pendingRecommendations": 0,
        "hospitalHealthScore": summary["hospitalHealthScore"],
    }


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
