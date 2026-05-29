import os
import base64
import httpx
from datetime import datetime, timedelta

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")

_token_cache: dict = {"token": None, "expires_at": None}


async def get_access_token() -> str:
    now = datetime.utcnow()
    if _token_cache["token"] and _token_cache["expires_at"] and _token_cache["expires_at"] > now:
        return _token_cache["token"]

    credentials = base64.b64encode(
        f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://accounts.spotify.com/api/token",
            headers={"Authorization": f"Basic {credentials}"},
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        data = resp.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + timedelta(seconds=data["expires_in"] - 60)
    return _token_cache["token"]


async def search_artist(name: str) -> dict | None:
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        return None
    try:
        token = await get_access_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.spotify.com/v1/search",
                headers={"Authorization": f"Bearer {token}"},
                params={"q": name, "type": "artist", "limit": 1},
            )
            resp.raise_for_status()
            data = resp.json()
        items = data.get("artists", {}).get("items", [])
        return items[0] if items else None
    except Exception:
        return None


def parse_artist(raw: dict) -> dict:
    return {
        "spotify_id": raw["id"],
        "popularity": raw.get("popularity"),
        "followers": raw.get("followers", {}).get("total"),
        "genres": raw.get("genres", []),
    }
