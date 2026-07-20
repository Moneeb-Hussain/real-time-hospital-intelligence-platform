import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from supabase import Client, create_client

load_dotenv()


def _clean_url(url: str) -> str:
    if "/rest/v1" in url:
        url = url.split("/rest/v1")[0]
    return url.strip().rstrip("/")


def _resolve_supabase_config() -> tuple[str, str]:
    """Prefer backend env names; fall back to Next.js public names on Vercel."""
    url = (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    )
    key = (
        os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or ""
    )
    return _clean_url(url), key.strip()


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url, key = _resolve_supabase_config()
    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail=(
                "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY "
                "(or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) "
                "in Vercel environment variables for the backend service."
            ),
        )
    return create_client(url, key)


class _LazySupabase:
    """Keep `from app.database.supabase import supabase` working without crashing on import."""

    def __getattr__(self, name: str):
        return getattr(get_supabase(), name)


supabase: Client = _LazySupabase()  # type: ignore[assignment]
