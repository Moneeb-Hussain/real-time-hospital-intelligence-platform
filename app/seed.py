"""Re-seed Spec resources only (patients/recs come from schema.sql or APIs).

Usage:
  python -m app.seed --clear
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
key = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or ""
).strip()

if not url or not key:
    print("❌ Set SUPABASE_URL and SUPABASE_KEY in .env")
    sys.exit(1)

if "/rest/v1" in url:
    url = url.split("/rest/v1")[0]
url = url.rstrip("/")

supabase = create_client(url, key)

# Minimal re-seed if schema.sql was applied without seed section
CORE = [
    {"id": "ICU-01", "resource_type": "bed", "name": "ICU-01", "unit": "ICU", "sub_type": "ICU", "is_available": True, "workload_count": 0, "max_load": 0},
    {"id": "ER-01", "resource_type": "bed", "name": "ER-01", "unit": "Emergency Resuscitation", "sub_type": "emergency", "is_available": True, "workload_count": 0, "max_load": 0},
    {"id": "ER-02", "resource_type": "bed", "name": "ER-02", "unit": "Emergency Resuscitation", "sub_type": "emergency", "is_available": True, "workload_count": 0, "max_load": 0},
    {"id": "D-01", "resource_type": "doctor", "name": "Dr. Ahmed Khan", "unit": "Emergency", "specialty": "Emergency Medicine", "sub_type": "emergency", "is_available": True, "workload_count": 3, "max_load": 6},
    {"id": "MON-01", "resource_type": "equipment", "name": "Cardiac Monitor #1", "unit": "Emergency Resuscitation", "sub_type": "cardiac_monitor", "is_available": True, "workload_count": 0, "max_load": 0},
]


def main() -> None:
    if "--clear" in sys.argv:
        print("Clearing resources...")
        supabase.table("resources").delete().neq("id", "__never__").execute()
    print("Upserting core resources (prefer full seed via supabase/schema.sql)...")
    for row in CORE:
        supabase.table("resources").upsert(row).execute()
        print(" ", row["id"])
    print("Done. For full demo data, run supabase/schema.sql in Supabase.")


if __name__ == "__main__":
    main()
