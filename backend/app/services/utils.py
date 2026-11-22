from __future__ import annotations
import base64
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
import httpx

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / "public"
UPLOADS = PUBLIC / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)

SPECIES_IMAGES = {
    "Mackerel": "/images/mackerel.jpg",
    "Sardines": "/images/fish-market-ram.jpg",
    "Seer Fish": "/images/seer-fish.jpg",
    "Pomfret": "/images/pomfret.jpg",
    "Prawns": "/images/prawns.jpg",
    "Tuna": "/images/tuna.jpg",
    "Anchovies": "/images/anchovies.jpg",
    "Indian Mackerel": "/images/mackerel.jpg",
}

WASTE_CATEGORY_IMAGES = {
    "fishmeal": "/images/fishmeal-factory.jpg",
    "fish_oil": "/images/fish-oil-capsules.jpg",
    "fertilizer": "/images/compost-india.jpg",
    "biomedical": "/images/lab-research.jpg",
}

LOCATION_COORDS = {
    "Mangaluru Fishing Harbour": (12.8546, 74.8369),
    "Mangaluru Harbour": (12.8546, 74.8369),
    "Bunder": (12.8648, 74.8354),
    "Panambur": (12.9350, 74.8045),
    "Kuloor": (12.9270, 74.8250),
    "Ullal": (12.8050, 74.8450),
    "Surathkal": (13.0068, 74.7943),
    "Mangaluru": (12.9141, 74.8560),
    "Baikampady Industrial Area": (12.9496, 74.8256),
}


def coords_for(location: Optional[str]):
    if not location:
        return 12.9141, 74.8560
    for key, val in LOCATION_COORDS.items():
        if key.lower() in location.lower() or location.lower() in key.lower():
            return val
    return 12.9141, 74.8560


async def save_image(source: Optional[str], fallback: str = "/images/fish-market-vizag.jpg") -> str:
    if not source:
        return fallback
    source = str(source).strip()
    try:
        m = re.match(r"^data:image/(png|jpeg|jpg|webp|gif);base64,(.+)$", source, re.I | re.S)
        if m:
            ext = m.group(1).lower().replace("jpeg", "jpg")
            data = base64.b64decode(m.group(2))
            name = f"{uuid.uuid4().hex}.{ext}"
            (UPLOADS / name).write_bytes(data)
            return f"/uploads/{name}"
        if source.startswith("/uploads/") or source.startswith("/images/"):
            return source
        if source.startswith("http://") or source.startswith("https://"):
            async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
                r = await client.get(source)
                if r.status_code == 200 and r.content:
                    ctype = r.headers.get("content-type", "")
                    ext = "jpg"
                    if "png" in ctype: ext = "png"
                    elif "webp" in ctype: ext = "webp"
                    elif "gif" in ctype: ext = "gif"
                    name = f"{uuid.uuid4().hex}.{ext}"
                    (UPLOADS / name).write_bytes(r.content)
                    return f"/uploads/{name}"
    except Exception:
        return fallback
    return fallback


def money(v) -> float:
    try:
        return round(float(v or 0), 2)
    except Exception:
        return 0.0


def normalize_role_out(role: str | None) -> str:
    if role == "processing_partner":
        return "processor"
    return role or "fisherman"


def public_user(user) -> dict:
    if not user:
        return {}
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": normalize_role_out(getattr(user, "role", None)),
        "location": user.location,
        "language": user.language or "en",
        "is_verified": bool(getattr(user, "is_verified", False)),
        "createdAt": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
    }


def calc_breakdown(price_per_kg: float, qty: float, fee_percent: float = 2.0, transport_per_kg: float = 4.0):
    gross = money(price_per_kg * qty)
    platform_fee = money(gross * fee_percent / 100.0)
    logistics = money(transport_per_kg * qty)
    payout = money(gross - platform_fee - logistics)
    return {
        "gross_value": gross,
        "platform_fee": platform_fee,
        "logistics_charges": logistics,
        "fisherman_payout": payout,
    }
