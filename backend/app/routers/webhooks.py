from __future__ import annotations
import re
from fastapi import APIRouter, Depends, HTTPException, Request, Query, Header
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..core.config import settings
from ..models.models import (
    User, Fisherman, Buyer, ProcessingPartner, CatchListing, CatchPhoto, MarketPrice, Notification,
    WasteListing, QualityInspection, Order, OrderItem, Payment, Logistics, TransactionHistory, ProcessingRequest
)
from ..services.utils import save_image, SPECIES_IMAGES, coords_for, money, calc_breakdown
from ..services.integrations import emit_n8n_event
from datetime import datetime
import httpx

router = APIRouter()

SPECIES_ALIASES = {
    "bangude": "Indian Mackerel", "mackerel": "Indian Mackerel", "ayala": "Indian Mackerel",
    "mathi": "Sardines", "sardine": "Sardines", "sardines": "Sardines",
    "anjal": "Seer Fish", "seer": "Seer Fish", "surmai": "Seer Fish",
    "manji": "Pomfret", "pomfret": "Pomfret", "paplet": "Pomfret",
    "yetti": "Prawns", "prawn": "Prawns", "prawns": "Prawns", "shrimp": "Prawns",
    "gedda": "Tuna", "tuna": "Tuna",
    "anchovy": "Anchovies", "anchovies": "Anchovies", "koddai": "Anchovies",
}

CONDITION_KEYWORDS = {
    "fresh": "Fresh", "damaged": "Damaged", "spoil": "Non-food-grade", "spoiled": "Non-food-grade",
    "waste": "Non-food-grade", "inspect": "Requires inspection", "rotten": "Non-food-grade",
}


def detect_language(text: str) -> str:
    # lightweight heuristic
    if re.search(r"[\u0C80-\u0CFF]", text): return "kn"
    if re.search(r"[\u0D00-\u0D7F]", text): return "ml"
    if re.search(r"[\u0B80-\u0BFF]", text): return "ta"
    if re.search(r"[\u0900-\u097F]", text): return "hi"
    return "en"


def parse_message(text: str):
    lower = text.lower()
    qty = None
    m = re.search(r"(\d+(?:[\.,]\d+)?)\s*(kg|kilo|kilogram)?", lower)
    if m:
        try:
            qty = float(m.group(1).replace(",", "."))
        except Exception:
            qty = None
    species = None
    for alias, name in SPECIES_ALIASES.items():
        if alias in lower:
            species = name
            break
    condition = "Fresh"
    for k, v in CONDITION_KEYWORDS.items():
        if k in lower:
            condition = v
            break
    return {"species": species, "quantity": qty, "condition": condition, "language": detect_language(text)}


@router.get("/webhooks/whatsapp")
@router.get("/api/webhooks/whatsapp")
def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
):
    if settings.whatsapp_verify_token and hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else hub_challenge
    if not settings.whatsapp_verify_token:
        return {"status": "webhook_ready", "message": "WHATSAPP_VERIFY_TOKEN not configured. Set it to enable Meta verification."}
    raise HTTPException(403, "Verification failed")


async def maybe_send_whatsapp(to: str, text: str):
    if not settings.whatsapp_token or not settings.whatsapp_phone_number_id:
        return False
    url = f"https://graph.facebook.com/v19.0/{settings.whatsapp_phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}", "Content-Type": "application/json"}
    payload = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text}}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, headers=headers, json=payload)
            return r.status_code < 300
    except Exception:
        return False


@router.post("/webhooks/whatsapp")
@router.post("/api/webhooks/whatsapp")
async def incoming_whatsapp(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    # support n8n/simple payloads and Meta-like payloads
    phone = body.get("phone") or body.get("from")
    text = body.get("message") or body.get("text")
    image = body.get("imageBase64") or body.get("imageUrl") or body.get("image")
    # Meta structure
    try:
        if not phone:
            entry = (body.get("entry") or [{}])[0]
            change = (entry.get("changes") or [{}])[0]
            value = change.get("value", {})
            msgs = value.get("messages") or []
            if msgs:
                msg = msgs[0]
                phone = msg.get("from")
                if msg.get("type") == "text":
                    text = msg.get("text", {}).get("body")
                elif msg.get("type") == "image":
                    text = msg.get("image", {}).get("caption") or text
    except Exception:
        pass

    if not phone or not text:
        # webhook-ready acknowledgement even if not actionable
        return {"status": "received", "message": "Webhook endpoint ready. Provide phone and message to create a catch draft."}

    parsed = parse_message(str(text))
    norm_phone = re.sub(r"\D", "", str(phone))
    # match user by phone suffix
    user = None
    for u in db.query(User).all():
        if u.phone and re.sub(r"\D", "", u.phone)[-10:] == norm_phone[-10:]:
            user = u
            break

    if not user or user.role != "fisherman":
        reply = "Please register as a fisherman on TRI-MATSYA to list your catch. Reply with species, quantity (kg), condition and location." if parsed["language"] == "en" else "Please register on TRI-MATSYA to list your catch."
        await maybe_send_whatsapp(norm_phone, reply)
        return {"status": "ignored", "reason": "sender_not_registered_fisherman", "parsed": parsed, "suggested_reply": reply}

    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if not fisher:
        fisher = Fisherman(user_id=user.id, harbour=user.location)
        db.add(fisher); db.flush()

    species = parsed["species"]
    qty = parsed["quantity"]
    if not species or not qty:
        reply = "I can help list your catch. Please send: species and quantity in kg (example: '50 kg Bangude, fresh, Mangaluru harbour')."
        await maybe_send_whatsapp(norm_phone, reply)
        return {"status": "needs_more_info", "parsed": parsed, "suggested_reply": reply}

    condition = parsed["condition"]
    is_waste = condition == "Non-food-grade"
    mp = db.query(MarketPrice).filter(MarketPrice.species_name == species).first()
    est_price = mp.estimated_price_per_kg if mp else 0
    loc = user.location or "Mangaluru Fishing Harbour"
    lat, lng = coords_for(loc)
    listing = CatchListing(
        fisherman_id=fisher.id, species_name=species, quantity_kg=qty, available_kg=qty,
        catch_date=datetime.utcnow(), landing_location=loc, lat=lat, lng=lng,
        condition=condition, expected_price_per_kg=est_price, availability="available" if not is_waste else "registered",
        notes=f"Created via WhatsApp automation. Original message: {text}", verification_status="pending",
        quality_status="unverified", is_waste=is_waste,
    )
    db.add(listing); db.flush()
    img_url = await save_image(image if isinstance(image, str) else None, fallback=SPECIES_IMAGES.get(species, "/images/fish-market-vizag.jpg"))
    db.add(CatchPhoto(catch_listing_id=listing.id, url=img_url))
    db.add(Notification(user_id=user.id, title="Catch listing created", message=f"{qty} kg {species} listing submitted for verification.", type="info"))
    db.commit()

    confirmation = f"TRI-MATSYA: Listing #{listing.id} created for {qty} kg {species} ({condition}). Verification pending. Estimated market price: ₹{est_price}/kg."
    await maybe_send_whatsapp(norm_phone, confirmation)
    emit_n8n_event("whatsapp.listing_created", {
        "listing_id": listing.id, "user_id": user.id, "phone": norm_phone, "species": species,
        "quantity_kg": qty, "condition": condition, "is_waste": is_waste, "estimated_price_per_kg": est_price,
        "parsed": parsed,
    })
    return {"status": "listing_created", "listing_id": listing.id, "parsed": parsed, "confirmation": confirmation}


def _require_n8n_secret(x_n8n_webhook_secret: str | None):
    if settings.n8n_webhook_secret and x_n8n_webhook_secret != settings.n8n_webhook_secret:
        raise HTTPException(403, "Invalid n8n webhook secret")


@router.post("/webhooks/n8n")
@router.post("/api/webhooks/n8n")
async def incoming_n8n(
    request: Request,
    db: Session = Depends(get_db),
    x_n8n_webhook_secret: str | None = Header(None),
):
    _require_n8n_secret(x_n8n_webhook_secret)
    body = await request.json()
    action = (body.get("action") or body.get("event") or "").strip()
    if not action:
        return {"status": "ready", "message": "n8n webhook endpoint ready. Send JSON with action/event.", "supported_actions": [
            "create_catch_listing", "create_waste_listing", "update_order_status", "create_order", "ping"
        ]}

    if action == "ping":
        return {"status": "ok", "message": "pong"}

    if action == "create_catch_listing":
        phone = re.sub(r"\D", "", str(body.get("phone") or ""))
        user = None
        for u in db.query(User).all():
            if u.phone and re.sub(r"\D", "", u.phone)[-10:] == phone[-10:]:
                user = u; break
        if not user or user.role != "fisherman":
            return {"status": "ignored", "reason": "sender_not_registered_fisherman"}
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        if not fisher:
            fisher = Fisherman(user_id=user.id, harbour=user.location); db.add(fisher); db.flush()
        species = body.get("species") or "Indian Mackerel"
        qty = float(body.get("quantity_kg") or body.get("quantity") or 0)
        if qty <= 0:
            raise HTTPException(400, "quantity_kg required")
        condition = body.get("condition") or "Fresh"
        loc = body.get("landing_location") or user.location or "Mangaluru Fishing Harbour"
        lat, lng = coords_for(loc)
        mp = db.query(MarketPrice).filter(MarketPrice.species_name == species).first()
        est_price = mp.estimated_price_per_kg if mp else float(body.get("expected_price_per_kg") or 0)
        listing = CatchListing(
            fisherman_id=fisher.id, species_name=species, quantity_kg=qty, available_kg=qty,
            catch_date=datetime.utcnow(), landing_location=loc, lat=lat, lng=lng,
            condition=condition, expected_price_per_kg=est_price, availability="available",
            notes=body.get("notes") or "Created via n8n automation", verification_status="pending",
            quality_status="unverified", is_waste=False,
        )
        db.add(listing); db.flush()
        img_url = await save_image(body.get("imageUrl") or body.get("photo_url"), fallback=SPECIES_IMAGES.get(species, "/images/fish-market-vizag.jpg"))
        db.add(CatchPhoto(catch_listing_id=listing.id, url=img_url))
        db.add(Notification(user_id=user.id, title="Catch listing created", message=f"{qty} kg {species} listing submitted via automation.", type="info"))
        db.commit()
        emit_n8n_event("catch.listing_created", {"listing_id": listing.id, "user_id": user.id, "species": species, "quantity_kg": qty})
        return {"status": "listing_created", "listing_id": listing.id}

    if action == "create_waste_listing":
        phone = re.sub(r"\D", "", str(body.get("phone") or ""))
        user = None
        for u in db.query(User).all():
            if u.phone and re.sub(r"\D", "", u.phone)[-10:] == phone[-10:]:
                user = u; break
        if not user or user.role != "fisherman":
            return {"status": "ignored", "reason": "sender_not_registered_fisherman"}
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        if not fisher:
            fisher = Fisherman(user_id=user.id, harbour=user.location); db.add(fisher); db.flush()
        qty = float(body.get("quantity_kg") or body.get("quantity") or 0)
        if qty <= 0:
            raise HTTPException(400, "quantity_kg required")
        loc = body.get("collection_location") or body.get("location") or user.location or "Mangaluru Fishing Harbour"
        lat, lng = coords_for(loc)
        w = WasteListing(
            fisherman_id=fisher.id,
            material_type=body.get("material_type") or "Fish by-product",
            species_name=body.get("species_name") or body.get("species"),
            quantity_kg=qty, available_kg=qty,
            condition=body.get("condition") or "Non-food-grade",
            category=body.get("category") or "fishmeal",
            collection_location=loc, lat=lat, lng=lng,
            photo_url=body.get("photo_url") or "/images/fish-processing.jpg",
            inspection_status="pending", suitability_status="awaiting_inspection",
            notes=body.get("notes") or "Created via n8n automation",
        )
        db.add(w); db.flush()
        db.add(QualityInspection(waste_listing_id=w.id, status="pending", notes="Awaiting authorized inspection"))
        db.commit()
        emit_n8n_event("waste.listing_created", {"waste_listing_id": w.id, "user_id": user.id, "quantity_kg": qty, "category": w.category})
        return {"status": "waste_listing_created", "waste_listing_id": w.id}

    if action == "update_order_status":
        oid = body.get("order_id")
        status = body.get("status")
        if not oid or not status:
            raise HTTPException(400, "order_id and status required")
        o = db.get(Order, int(oid))
        if not o:
            raise HTTPException(404, "Order not found")
        o.status = status
        for l in db.query(Logistics).filter(Logistics.order_id == o.id).all():
            l.status = status
            if status == "Delivered":
                l.delivery_time = datetime.utcnow()
        if status == "Delivered":
            for p in db.query(Payment).filter(Payment.order_id == o.id).all():
                p.status = "Paid"
        db.add(TransactionHistory(order_id=o.id, event_type="status_update", description=f"Order status updated to {status} via n8n"))
        db.commit()
        emit_n8n_event("order.status_updated", {"order_id": o.id, "status": status})
        return {"status": "updated", "order_id": o.id, "new_status": status}

    raise HTTPException(400, f"Unsupported action: {action}")
