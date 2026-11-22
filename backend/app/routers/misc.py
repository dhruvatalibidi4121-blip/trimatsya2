from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db.session import get_db
from ..core.deps import get_current_user, require_roles
from ..core.config import settings
from ..models.models import (
    ContactMessage, User, Fisherman, Buyer, ProcessingPartner, CatchListing, Order, OrderItem,
    Payment, WasteListing, ProcessingRequest, Logistics, MarketPrice
)
from ..services.utils import public_user, coords_for, money

router = APIRouter()


@router.get("/api/health")
def health():
    return {"ok": True, "service": "tri-matsya-fastapi"}


@router.get("/api/integrations")
def integrations(request=None):
    return {
        "whatsapp": bool(settings.whatsapp_token and settings.whatsapp_phone_number_id),
        "n8n": bool(settings.n8n_webhook_url),
        "whatsapp_configured": bool(settings.whatsapp_token and settings.whatsapp_phone_number_id),
        "n8n_configured": bool(settings.n8n_webhook_url),
        "otp_ready": True,
        "maps_ready": False,  # frontend can use Leaflet/OSM by default; Google Maps key can be added
        "contactNumber": settings.whatsapp_contact_number or "",
        "webhooks": {
            "whatsapp_inbound": "/webhooks/whatsapp",
            "n8n_event_target_configured": bool(settings.n8n_webhook_url),
        },
    }


@router.post("/api/contact")
def contact(payload: dict, db: Session = Depends(get_db)):
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    message = (payload.get("message") or "").strip()
    subject = (payload.get("subject") or "General enquiry").strip()
    if not name or not email or not message:
        raise HTTPException(400, "Name, email and message are required.")
    db.add(ContactMessage(name=name, email=email, subject=subject, message=message))
    db.commit()
    return {"message": "Thank you. Your enquiry has been recorded."}


@router.get("/api/map-data")
def map_data(db: Session = Depends(get_db)):
    markers = []
    for u in db.query(User).filter(User.role.in_(["fisherman", "buyer", "processing_partner"])).all():
        lat, lng = u.lat, u.lng
        if lat is None or lng is None:
            lat, lng = coords_for(u.location)
        t = "fisherman" if u.role == "fisherman" else ("buyer" if u.role == "buyer" else "processor")
        markers.append({"id": u.id, "name": u.name, "type": t, "location": u.location or "", "lat": lat, "lng": lng})
    # demo fixed points
    markers.extend([
        {"id": "harbour", "name": "Mangaluru Fishing Harbour", "type": "landing", "location": "Bunder, Mangaluru", "lat": 12.8546, "lng": 74.8369},
        {"id": "collection", "name": "Collection Point - Kuloor", "type": "collection", "location": "Kuloor", "lat": 12.9270, "lng": 74.8250},
    ])
    return {"markers": markers}


def _monthly_series(db: Session, model_date_col, value_expr=None):
    # SQLite-friendly last 6 months
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    out = []
    for i in range(5, -1, -1):
        d = (now.replace(day=1) - timedelta(days=30*i))
        key = d.strftime("%Y-%m")
        q = db.query(model_date_col)
        out.append(key)
    return out


@router.get("/api/dashboard/fisherman")
def dashboard_fisherman(user=Depends(get_current_user), db: Session = Depends(get_db)):
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if user.role == "admin":
        fisher = db.query(Fisherman).first()
    if not fisher:
        return {"stats": {}, "listings": [], "orders": [], "payments": []}
    listings = db.query(CatchListing).filter(CatchListing.fisherman_id == fisher.id).order_by(CatchListing.id.desc()).all()
    order_ids = [r[0] for r in db.query(OrderItem.order_id).filter(OrderItem.fisherman_id == fisher.id).distinct().all()]
    orders = db.query(Order).filter(Order.id.in_(order_ids)).order_by(Order.id.desc()).all() if order_ids else []
    payments = db.query(Payment).filter(Payment.fisherman_id == fisher.id).order_by(Payment.id.desc()).all()
    listings_rows = []
    for l in listings:
        img = l.photos[0].url if l.photos else None
        listings_rows.append({"id": l.id, "species": l.species_name, "quantity_kg": l.available_kg, "price_per_kg": l.expected_price_per_kg, "status": l.availability, "verified": l.verification_status=="verified", "location": l.landing_location, "image": img, "created_at": l.created_at.isoformat() if l.created_at else None, "type": "waste" if l.is_waste else "fresh"})
    orders_rows = []
    for o in orders:
        buyer = db.get(Buyer, o.buyer_id); bu = db.get(User, buyer.user_id) if buyer else None
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id, OrderItem.fisherman_id == fisher.id).all()
        desc_parts = []
        for it in items:
            cl = db.get(CatchListing, it.catch_listing_id)
            desc_parts.append(f"{it.quantity_kg} kg {cl.species_name}" if cl else f"{it.quantity_kg} kg")
        orders_rows.append({"id": o.id, "buyer_name": bu.name if bu else "", "items": ", ".join(desc_parts), "total_quantity": sum(i.quantity_kg for i in items), "total_amount": sum(i.payout_amount + i.platform_fee + i.logistics_charge for i in items), "status": o.status, "delivery_location": o.delivery_location, "created_at": o.created_at.isoformat() if o.created_at else None})
    pay_rows = [{"id": p.id, "order_id": p.order_id, "amount": p.amount, "fee_amount": p.fee_amount, "transport_amount": p.logistics_amount, "status": p.status, "created_at": p.created_at.isoformat() if p.created_at else None} for p in payments]
    active = len([l for l in listings if l.availability == "available" and l.available_kg > 0])
    expected = sum(p.amount + p.fee_amount + p.logistics_amount for p in payments)
    paid = sum(p.amount for p in payments if p.status == "Paid")
    pending = sum(p.amount for p in payments if p.status != "Paid")
    collections = len([o for o in orders if o.status in ("Picked up","In transit","Delivered")])
    sold_qty = sum(i.quantity_kg for i in db.query(OrderItem).filter(OrderItem.fisherman_id == fisher.id).all())
    return {"stats": {"activeListings": active, "expected": money(expected), "paid": money(paid), "pendingAmount": money(pending), "orderCount": len(orders), "collections": collections, "totalQuantitySoldKg": money(sold_qty)}, "listings": listings_rows, "orders": orders_rows, "payments": pay_rows}


@router.get("/api/dashboard/buyer")
def dashboard_buyer(user=Depends(get_current_user), db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
    if user.role == "admin":
        buyer = db.query(Buyer).first()
    orders = db.query(Order).filter(Order.buyer_id == (buyer.id if buyer else -1)).order_by(Order.id.desc()).all() if buyer else []
    orders_rows = []
    for o in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        desc = []
        for it in items:
            cl = db.get(CatchListing, it.catch_listing_id)
            if cl: desc.append(f"{it.quantity_kg} kg {cl.species_name}")
        orders_rows.append({"id": o.id, "buyer_name": user.name, "items": ", ".join(desc), "total_quantity": o.total_quantity_kg, "total_amount": o.gross_value, "status": o.status, "delivery_location": o.delivery_location, "created_at": o.created_at.isoformat() if o.created_at else None})
    open_orders = len([o for o in orders if o.status not in ("Delivered","Cancelled")])
    spent = sum(o.gross_value for o in orders)
    total_qty = sum(o.total_quantity_kg for o in orders)
    return {"stats": {"openOrders": open_orders, "spent": money(spent), "orderCount": len(orders), "totalQuantityKg": money(total_qty)}, "orders": orders_rows}


@router.get("/api/dashboard/processor")
def dashboard_processor(user=Depends(get_current_user), db: Session = Depends(get_db)):
    partner = db.query(ProcessingPartner).filter(ProcessingPartner.user_id == user.id).first()
    if user.role == "admin":
        partner = db.query(ProcessingPartner).first()
    reqs = db.query(ProcessingRequest).filter(ProcessingRequest.partner_id == (partner.id if partner else -1)).order_by(ProcessingRequest.id.desc()).all() if partner else []
    requests_rows = []
    for pr in reqs:
        w = db.get(WasteListing, pr.waste_listing_id)
        requests_rows.append({"id": pr.id, "category": w.category if w else "", "species": w.species_name if w else "", "quantity_kg": pr.quantity_kg, "status": pr.status, "scheduled_at": pr.requested_collection_date.isoformat() if pr.requested_collection_date else None, "image": w.photo_url if w else None, "location": w.collection_location if w else "", "created_at": pr.created_at.isoformat() if pr.created_at else None})
    available = db.query(WasteListing).filter(WasteListing.inspection_status == "approved", WasteListing.available_kg > 0).count()
    deliveries = len([r for r in reqs if r.status in ("Collected","Delivered")])
    requested_qty = sum(r.quantity_kg for r in reqs)
    delivered_qty = sum(r.quantity_kg for r in reqs if r.status in ("Collected","Delivered","Completed"))
    return {"stats": {"requests": len(reqs), "availableMaterials": available, "deliveries": deliveries, "totalRequestedKg": money(requested_qty), "totalDeliveredKg": money(delivered_qty)}, "requests": requests_rows}
