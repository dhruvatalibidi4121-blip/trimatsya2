from __future__ import annotations
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import Order, OrderItem, CatchListing, Buyer, Fisherman, User, Payment, Logistics, TransactionHistory, Notification, MarketPrice, AggregatedCatch
from ..schemas.schemas import OrderCreate
from ..services.utils import money, calc_breakdown
from ..services.integrations import emit_n8n_event

router = APIRouter()


def ensure_buyer(db: Session, user):
    buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
    if not buyer and user.role == "admin":
        buyer = db.query(Buyer).first()
    if not buyer:
        # auto-create for convenience
        buyer = Buyer(user_id=user.id, business_name=user.name, business_type="buyer", delivery_address=user.location)
        db.add(buyer); db.flush()
    return buyer


@router.post("/orders")
@router.post("/api/orders")
def create_order(payload: OrderCreate, user=Depends(require_roles("buyer", "admin")), db: Session = Depends(get_db)):
    buyer = ensure_buyer(db, user)
    if not payload.items:
        raise HTTPException(400, "No items provided.")
    delivery_location = payload.deliveryLocation or payload.delivery_location or buyer.delivery_address or user.location or "Mangaluru"
    delivery_date = payload.delivery_date
    order = Order(buyer_id=buyer.id, order_type="fresh", status="Requested", delivery_location=delivery_location, delivery_date=delivery_date, notes=payload.notes)
    db.add(order); db.flush()
    total_qty = 0.0
    gross = 0.0
    fee_total = 0.0
    log_total = 0.0
    payout_total = 0.0
    pickup_location = None
    agg_map = {}
    for item in payload.items:
        listing_id = item.listingId or item.catch_listing_id
        qty = float(item.quantity)
        listing = db.get(CatchListing, listing_id) if listing_id else None
        if not listing or listing.available_kg < qty or listing.availability != "available":
            raise HTTPException(400, f"Listing unavailable or insufficient quantity (id={listing_id}).")
        if listing.is_waste or listing.condition == "Non-food-grade":
            raise HTTPException(400, "Non-food-grade items cannot be ordered in the fresh marketplace.")
        mp = db.query(MarketPrice).filter(MarketPrice.species_name == listing.species_name).first()
        price = listing.expected_price_per_kg or (mp.estimated_price_per_kg if mp else 0)
        br = calc_breakdown(price, qty)
        oi = OrderItem(
            order_id=order.id, catch_listing_id=listing.id, fisherman_id=listing.fisherman_id,
            quantity_kg=qty, price_per_kg=price, platform_fee=br["platform_fee"],
            logistics_charge=br["logistics_charges"], payout_amount=br["fisherman_payout"],
        )
        db.add(oi); db.flush()
        listing.available_kg = money(listing.available_kg - qty)
        if listing.available_kg <= 0:
            listing.availability = "sold"
            listing.available_kg = 0
        total_qty += qty; gross += br["gross_value"]; fee_total += br["platform_fee"]; log_total += br["logistics_charges"]; payout_total += br["fisherman_payout"]
        pickup_location = pickup_location or listing.landing_location
        agg_map[listing.species_name] = agg_map.get(listing.species_name, 0.0) + qty
        # payment record per item/fisherman
        db.add(Payment(order_id=order.id, fisherman_id=listing.fisherman_id, amount=br["fisherman_payout"], fee_amount=br["platform_fee"], logistics_amount=br["logistics_charges"], status="Pending"))
    for sp, qsum in agg_map.items():
        db.add(AggregatedCatch(order_id=order.id, species_name=sp, requested_quantity_kg=qsum, aggregated_quantity_kg=qsum, status="aggregated"))
    order.total_quantity_kg = money(total_qty)
    order.gross_value = money(gross)
    order.platform_fee = money(fee_total)
    order.logistics_charges = money(log_total)
    order.fisherman_payout = money(payout_total)
    # auto-create logistics record
    db.add(Logistics(order_id=order.id, workflow_type="fresh", pickup_location=pickup_location or "Mangaluru Fishing Harbour", destination_location=delivery_location, status="Requested", cold_chain_required=True))
    db.add(TransactionHistory(order_id=order.id, user_id=user.id, event_type="order_created", amount=order.gross_value, description=f"Fresh order #{order.id} created"))
    db.commit(); db.refresh(order)
    emit_n8n_event("order.created", {
        "order_id": order.id, "buyer_user_id": user.id, "status": order.status,
        "total_quantity_kg": order.total_quantity_kg, "gross_value": order.gross_value,
        "platform_fee": order.platform_fee, "logistics_charges": order.logistics_charges,
        "fisherman_payout": order.fisherman_payout, "delivery_location": order.delivery_location,
    })
    return {"orderId": order.id, "id": order.id, "message": "Order placed successfully.", "breakdown": {
        "gross_value": order.gross_value, "platform_fee": order.platform_fee, "logistics_charges": order.logistics_charges, "fisherman_payout": order.fisherman_payout
    }}


def order_to_dict(o: Order, db: Session, include_items=False):
    buyer = db.get(Buyer, o.buyer_id)
    buyer_user = db.get(User, buyer.user_id) if buyer else None
    items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
    item_desc = []
    for it in items:
        cl = db.get(CatchListing, it.catch_listing_id)
        if cl:
            item_desc.append(f"{it.quantity_kg} kg {cl.species_name}")
    d = {
        "id": o.id,
        "buyer_id": o.buyer_id,
        "buyer_name": buyer_user.name if buyer_user else "Buyer",
        "type": o.order_type,
        "status": o.status,
        "total_quantity": o.total_quantity_kg,
        "total_amount": o.gross_value,
        "gross_value": o.gross_value,
        "platform_fee": o.platform_fee,
        "logistics_charges": o.logistics_charges,
        "fisherman_payout": o.fisherman_payout,
        "delivery_location": o.delivery_location,
        "delivery_date": o.delivery_date.isoformat() if o.delivery_date else None,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "items": ", ".join(item_desc),
    }
    if include_items:
        out_items = []
        for it in items:
            cl = db.get(CatchListing, it.catch_listing_id)
            fisher = db.get(Fisherman, it.fisherman_id)
            fuser = db.get(User, fisher.user_id) if fisher else None
            img = cl.photos[0].url if cl and cl.photos else None
            out_items.append({
                "id": it.id,
                "listing_id": it.catch_listing_id,
                "species": cl.species_name if cl else "",
                "image": img,
                "quantity_kg": it.quantity_kg,
                "price_per_kg": it.price_per_kg,
                "platform_fee": it.platform_fee,
                "logistics_charge": it.logistics_charge,
                "fisherman_payment": it.payout_amount,
                "fisherman_name": fuser.name if fuser else "",
                "pickup_location": cl.landing_location if cl else "",
            })
        d["order_items"] = out_items
    return d


@router.get("/orders")
@router.get("/api/orders")
def list_orders(user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Order)
    if user.role == "buyer":
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        if buyer:
            q = q.filter(Order.buyer_id == buyer.id)
        else:
            return {"orders": []}
    elif user.role == "fisherman":
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        if not fisher:
            return {"orders": []}
        ids = [r[0] for r in db.query(OrderItem.order_id).filter(OrderItem.fisherman_id == fisher.id).distinct().all()]
        q = q.filter(Order.id.in_(ids)) if ids else q.filter(False)
    rows = q.order_by(Order.id.desc()).all()
    return {"orders": [order_to_dict(o, db) for o in rows]}


@router.get("/orders/{id}")
@router.get("/api/orders/{id}")
def get_order(id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    o = db.get(Order, id)
    if not o:
        raise HTTPException(404, "Order not found.")
    # basic access check
    if user.role == "buyer":
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        if not buyer or o.buyer_id != buyer.id:
            raise HTTPException(403, "Not allowed.")
    elif user.role == "fisherman":
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        ok = db.query(OrderItem).filter(OrderItem.order_id == o.id, OrderItem.fisherman_id == (fisher.id if fisher else -1)).first()
        if not ok:
            raise HTTPException(403, "Not allowed.")
    data = order_to_dict(o, db, include_items=True)
    # frontend expects order and items
    return {"order": data, "items": data.get("order_items", [])}


@router.patch("/orders/{id}/status")
@router.patch("/api/orders/{id}/status")
def update_order_status(id: int, payload: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    o = db.get(Order, id)
    if not o:
        raise HTTPException(404, "Order not found.")
    status = payload.get("status")
    if not status:
        raise HTTPException(400, "Status required.")
    # buyers can cancel/request limited; admin can set any; keep simple
    o.status = status
    for l in db.query(Logistics).filter(Logistics.order_id == o.id).all():
        l.status = status
        if status == "Delivered":
            l.delivery_time = datetime.utcnow()
    if status == "Delivered":
        for p in db.query(Payment).filter(Payment.order_id == o.id).all():
            p.status = "Paid"
    db.add(TransactionHistory(order_id=o.id, user_id=user.id, event_type="status_update", description=f"Order status updated to {status}"))
    db.commit()
    emit_n8n_event("order.status_updated", {"order_id": o.id, "status": status})
    return {"ok": True, "status": status}


@router.get("/api/payments")
def list_payments(user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Payment)
    if user.role == "fisherman":
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        q = q.filter(Payment.fisherman_id == (fisher.id if fisher else -1))
    elif user.role == "buyer":
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        order_ids = [o.id for o in db.query(Order).filter(Order.buyer_id == (buyer.id if buyer else -1)).all()]
        q = q.filter(Payment.order_id.in_(order_ids)) if order_ids else q.filter(False)
    rows = q.order_by(Payment.id.desc()).all()
    out = []
    for p in rows:
        fisher = db.get(Fisherman, p.fisherman_id) if p.fisherman_id else None
        fuser = db.get(User, fisher.user_id) if fisher else None
        order = db.get(Order, p.order_id)
        out.append({
            "id": p.id,
            "order_id": p.order_id,
            "fisherman_id": p.fisherman_id,
            "fisherman_name": fuser.name if fuser else "",
            "quantity_kg": 0,  # approximate; could join
            "amount": p.amount,
            "fee_amount": p.fee_amount,
            "transport_amount": p.logistics_amount,
            "status": p.status,
            "method": p.method,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "delivery_location": order.delivery_location if order else "",
        })
    # enrich quantity from order items if possible
    for r in out:
        oi = db.query(OrderItem).filter(OrderItem.order_id == r["order_id"]).first()
        if oi: r["quantity_kg"] = oi.quantity_kg
    return {"payments": out}


@router.patch("/api/payments/{id}")
def update_payment(id: int, payload: dict, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    p = db.get(Payment, id)
    if not p: raise HTTPException(404, "Payment not found.")
    if "status" in payload: p.status = payload["status"]
    if "method" in payload: p.method = payload["method"]
    db.commit()
    return {"ok": True}
