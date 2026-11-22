from __future__ import annotations
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db.session import get_db
from ..core.deps import require_roles, get_current_user
from ..models.models import (
    User, Fisherman, Buyer, ProcessingPartner, CatchListing, Order, OrderItem, Payment,
    WasteListing, ProcessingRequest, Logistics, MarketPrice, PlatformFee, ContactMessage, TransactionHistory
)
from ..services.utils import public_user, money

router = APIRouter()


@router.get("/admin/dashboard")
@router.get("/api/dashboard/admin")
def admin_dashboard(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    fishermen = db.query(Fisherman).count()
    buyers = db.query(Buyer).count()
    partners = db.query(ProcessingPartner).count()
    listings = db.query(CatchListing).count()
    orders = db.query(Order).count()
    completed_orders = db.query(Order).filter(Order.status == "Delivered").count()
    fish_sold = db.query(func.coalesce(func.sum(OrderItem.quantity_kg), 0)).scalar() or 0
    gross_trade = db.query(func.coalesce(func.sum(Order.gross_value), 0)).scalar() or 0
    fisherman_payouts = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    logistics_total = db.query(func.coalesce(func.sum(Order.logistics_charges), 0)).scalar() or 0
    revenue = db.query(func.coalesce(func.sum(Payment.fee_amount), 0)).scalar() or 0
    waste_recovered = db.query(func.coalesce(func.sum(ProcessingRequest.quantity_kg), 0)).filter(ProcessingRequest.status.in_(["Collected","Delivered","Completed"])).scalar() or 0
    waste_requested = db.query(func.coalesce(func.sum(ProcessingRequest.quantity_kg), 0)).scalar() or 0

    # charts
    months = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        d = (now.replace(day=1) - timedelta(days=30*i))
        key = d.strftime("%Y-%m")
        months.append(key)
    monthly = []
    revenue_series = []
    for m in months:
        c = db.query(Order).filter(func.strftime("%Y-%m", Order.created_at) == m).count() if db.bind.dialect.name == "sqlite" else db.query(Order).filter(func.to_char(Order.created_at, 'YYYY-MM') == m).count()
        monthly.append({"month": m, "count": c})
        r = db.query(func.coalesce(func.sum(Payment.fee_amount), 0)).filter(func.strftime("%Y-%m", Payment.created_at) == m).scalar() if db.bind.dialect.name == "sqlite" else db.query(func.coalesce(func.sum(Payment.fee_amount), 0)).filter(func.to_char(Payment.created_at, 'YYYY-MM') == m).scalar()
        revenue_series.append({"month": m, "value": money(r)})
    species_rows = db.query(CatchListing.species_name, func.sum(CatchListing.quantity_kg)).group_by(CatchListing.species_name).all()
    species = [{"name": s, "value": float(v or 0)} for s, v in species_rows]

    users = [public_user(u) for u in db.query(User).order_by(User.id.desc()).all()]
    # compatible listings payload for admin UI
    listings_rows = []
    for l in db.query(CatchListing).order_by(CatchListing.id.desc()).all():
        fisher = db.get(Fisherman, l.fisherman_id)
        fu = db.get(User, fisher.user_id) if fisher else None
        img = l.photos[0].url if l.photos else None
        listings_rows.append({
            "id": l.id, "type": "waste" if l.is_waste else "fresh", "species": l.species_name,
            "quantity_kg": l.available_kg, "item_condition": l.condition, "location": l.landing_location,
            "price_per_kg": l.expected_price_per_kg, "image": img, "description": l.notes, "verified": l.verification_status=="verified",
            "status": l.availability, "seller_name": fu.name if fu else "", "created_at": l.created_at.isoformat() if l.created_at else None
        })
    orders_rows = []
    for o in db.query(Order).order_by(Order.id.desc()).all():
        buyer = db.get(Buyer, o.buyer_id); bu = db.get(User, buyer.user_id) if buyer else None
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        desc = []
        for it in items:
            cl = db.get(CatchListing, it.catch_listing_id)
            if cl: desc.append(f"{it.quantity_kg} kg {cl.species_name}")
        orders_rows.append({"id": o.id, "buyer_name": bu.name if bu else "", "items": ", ".join(desc), "total_quantity": o.total_quantity_kg, "total_amount": o.gross_value, "status": o.status, "delivery_location": o.delivery_location, "created_at": o.created_at.isoformat() if o.created_at else None})
    payments = []
    for p in db.query(Payment).order_by(Payment.id.desc()).all():
        fisher = db.get(Fisherman, p.fisherman_id) if p.fisherman_id else None
        fu = db.get(User, fisher.user_id) if fisher else None
        payments.append({"id": p.id, "order_id": p.order_id, "fisherman_name": fu.name if fu else "", "amount": p.amount, "fee_amount": p.fee_amount, "transport_amount": p.logistics_amount, "status": p.status, "created_at": p.created_at.isoformat() if p.created_at else None, "quantity_kg": 0})
    prices = [{"species": mp.species_name, "local_name": mp.local_name, "price_per_kg": mp.estimated_price_per_kg, "updated_at": mp.updated_at.isoformat() if mp.updated_at else None} for mp in db.query(MarketPrice).all()]
    logistics = []
    for l in db.query(Logistics).order_by(Logistics.id.desc()).all():
        logistics.append({"id": l.id, "order_id": l.order_id, "waste_request_id": l.processing_request_id, "type": l.workflow_type, "pickup_location": l.pickup_location, "destination": l.destination_location, "transporter": l.driver_name or "", "status": l.status, "created_at": l.created_at.isoformat() if l.created_at else None})
    waste_requests = []
    for pr in db.query(ProcessingRequest).order_by(ProcessingRequest.id.desc()).all():
        w = db.get(WasteListing, pr.waste_listing_id)
        partner = db.get(ProcessingPartner, pr.partner_id); pu = db.get(User, partner.user_id) if partner else None
        waste_requests.append({"id": pr.id, "processor_name": (partner.organization_name if partner else None) or (pu.name if pu else ""), "species": w.species_name if w else "", "category": w.category if w else "", "quantity_kg": pr.quantity_kg, "status": pr.status, "created_at": pr.created_at.isoformat() if pr.created_at else None})
    messages = [{"id": m.id, "name": m.name, "email": m.email, "subject": m.subject, "message": m.message, "created_at": m.created_at.isoformat() if m.created_at else None} for m in db.query(ContactMessage).order_by(ContactMessage.id.desc()).all()]

    stats = {
        "fishermen": fishermen,
        "businesses": buyers + partners,
        "buyers": buyers,
        "partners": partners,
        "listings": listings,
        "orders": orders,
        "completed_orders": completed_orders,
        "fishSold": money(fish_sold),
        "grossTradeValue": money(gross_trade),
        "fishermanPayouts": money(fisherman_payouts),
        "logisticsCharges": money(logistics_total),
        "revenue": money(revenue),
        "wasteCollected": money(waste_recovered),
        "wasteRequested": money(waste_requested),
        "processors": partners,
    }
    return {
        "stats": stats,
        "charts": {"monthly": monthly, "species": species, "revenue": revenue_series},
        "users": users,
        "listings": listings_rows,
        "orders": orders_rows,
        "payments": payments,
        "prices": prices,
        "logistics": logistics,
        "wasteRequests": waste_requests,
        "messages": messages,
    }


@router.get("/admin/users")
def admin_users(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return {"users": [public_user(u) for u in db.query(User).order_by(User.id.desc()).all()]}


@router.patch("/api/users/{id}")
def update_user_role(id: int, payload: dict, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    u = db.get(User, id)
    if not u: raise HTTPException(404, "User not found")
    if "role" in payload:
        role = payload["role"]
        if role == "processor":
            role = "processing_partner"
        if role in ("fisherman","buyer","processing_partner","admin"):
            u.role = role
    if "is_verified" in payload:
        u.is_verified = bool(payload["is_verified"])
    db.commit()
    return {"ok": True}


@router.get("/admin/analytics")
def admin_analytics(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    # reuse dashboard logic partially
    dash = admin_dashboard(user=user, db=db)
    income_paid = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == "Paid").scalar() or 0
    income_pending = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status != "Paid").scalar() or 0
    avg_price = db.query(func.coalesce(func.avg(OrderItem.price_per_kg), 0)).scalar() or 0
    return {
        "kpis": {
            "fishermen_income_generated": money(income_paid),
            "fishermen_income_pending": money(income_pending),
            "average_selling_price": money(avg_price),
            "fish_quantity_traded": dash["stats"]["fishSold"],
            "gross_trade_value": dash["stats"]["grossTradeValue"],
            "logistics_charges_total": dash["stats"]["logisticsCharges"],
            "business_buyers": dash["stats"]["buyers"],
            "completed_orders": dash["stats"]["completed_orders"],
            "waste_collected": dash["stats"]["wasteCollected"],
            "waste_requested": dash["stats"]["wasteRequested"],
            "platform_revenue": dash["stats"]["revenue"],
        },
        "charts": dash["charts"],
        "notes": "All analytics and sums are calculated from platform database records (sample/demo records may be included and are replaceable)."
    }


@router.post("/api/market-prices")
def upsert_market_price(payload: dict, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    species = payload.get("species")
    price = payload.get("price")
    if not species or price is None:
        raise HTTPException(400, "Species and price required.")
    mp = db.query(MarketPrice).filter(MarketPrice.species_name == species).first()
    if not mp:
        mp = MarketPrice(species_name=species, estimated_price_per_kg=float(price), local_name=payload.get("local_name"))
        db.add(mp)
    else:
        mp.estimated_price_per_kg = float(price)
        if payload.get("local_name"): mp.local_name = payload["local_name"]
        mp.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.get("/fishers/profile")
def fisher_profile(user=Depends(get_current_user), db: Session = Depends(get_db)):
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if not fisher:
        raise HTTPException(404, "Fisherman profile not found.")
    return {"profile": {
        "id": fisher.id, "user_id": user.id, "name": user.name, "phone": user.phone, "location": user.location,
        "harbour": fisher.harbour, "vessel_name": fisher.vessel_name, "license_number": fisher.license_number,
        "verified_at": fisher.verified_at.isoformat() if fisher.verified_at else None
    }}
