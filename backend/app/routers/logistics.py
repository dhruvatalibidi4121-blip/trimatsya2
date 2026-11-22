from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import Logistics, Vehicle, TemperatureLog, Order, ProcessingRequest, ProcessingPartner, Fisherman, Buyer
from ..schemas.schemas import LogisticsPickupIn

router = APIRouter()


def logistics_to_dict(l: Logistics, db: Session):
    return {
        "id": l.id,
        "order_id": l.order_id,
        "waste_request_id": l.processing_request_id,
        "processing_request_id": l.processing_request_id,
        "type": l.workflow_type,
        "workflow_type": l.workflow_type,
        "pickup_location": l.pickup_location,
        "destination": l.destination_location,
        "destination_location": l.destination_location,
        "pickup_time": l.pickup_time.isoformat() if l.pickup_time else None,
        "delivery_time": l.delivery_time.isoformat() if l.delivery_time else None,
        "vehicle_id": l.vehicle_id,
        "driver_name": l.driver_name,
        "driver_phone": l.driver_phone,
        "transporter": l.driver_name or "Assigned vehicle",
        "status": l.status,
        "cold_chain_required": l.cold_chain_required,
        "current_temperature_c": l.current_temperature_c,
        "created_at": l.created_at.isoformat() if l.created_at else None,
    }


@router.post("/logistics/pickup")
def create_pickup(payload: LogisticsPickupIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    l = Logistics(
        order_id=payload.order_id,
        processing_request_id=payload.processing_request_id,
        workflow_type=payload.workflow_type,
        pickup_location=payload.pickup_location,
        destination_location=payload.destination_location,
        pickup_time=payload.pickup_time,
        vehicle_id=payload.vehicle_id,
        driver_name=payload.driver_name,
        driver_phone=payload.driver_phone,
        status="Requested",
        cold_chain_required=payload.cold_chain_required,
    )
    db.add(l); db.commit(); db.refresh(l)
    return {"logistics": logistics_to_dict(l, db)}


@router.get("/logistics/tracking")
@router.get("/api/logistics")
def tracking(user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Logistics)
    if user.role == "fisherman":
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        # show logistics for orders containing their items or waste requests from their listings - simplified to all for demo/small scope? better scope by orders
        from ..models.models import OrderItem
        oids = [r[0] for r in db.query(OrderItem.order_id).filter(OrderItem.fisherman_id == (fisher.id if fisher else -1)).distinct().all()]
        q = q.filter((Logistics.order_id.in_(oids)) | (Logistics.workflow_type == "waste")) if oids else q
    elif user.role == "buyer":
        buyer = db.query(Buyer).filter(Buyer.user_id == user.id).first()
        oids = [o.id for o in db.query(Order).filter(Order.buyer_id == (buyer.id if buyer else -1)).all()]
        q = q.filter(Logistics.order_id.in_(oids)) if oids else q.filter(False)
    elif user.role == "processing_partner":
        partner = db.query(ProcessingPartner).filter(ProcessingPartner.user_id == user.id).first()
        prids = [p.id for p in db.query(ProcessingRequest).filter(ProcessingRequest.partner_id == (partner.id if partner else -1)).all()]
        q = q.filter(Logistics.processing_request_id.in_(prids)) if prids else q.filter(False)
    rows = q.order_by(Logistics.id.desc()).all()
    return {"logistics": [logistics_to_dict(l, db) for l in rows]}


@router.get("/logistics/tracking/{id}")
@router.get("/api/logistics/{id}")
def tracking_one(id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    l = db.get(Logistics, id)
    if not l: raise HTTPException(404, "Not found")
    temps = db.query(TemperatureLog).filter(TemperatureLog.logistics_id == l.id).order_by(TemperatureLog.recorded_at.desc()).all()
    d = logistics_to_dict(l, db)
    d["temperature_logs"] = [{"temperature_c": t.temperature_c, "recorded_at": t.recorded_at.isoformat(), "alert": t.alert, "note": t.note} for t in temps]
    return {"logistics": d}


@router.patch("/api/logistics/{id}")
def update_logistics(id: int, payload: dict, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    l = db.get(Logistics, id)
    if not l: raise HTTPException(404, "Not found")
    if "status" in payload:
        l.status = payload["status"]
        if payload["status"] == "Picked up":
            l.pickup_time = datetime.utcnow()
        if payload["status"] == "Delivered":
            l.delivery_time = datetime.utcnow()
        # sync related
        if l.order_id:
            o = db.get(Order, l.order_id)
            if o: o.status = payload["status"]
        if l.processing_request_id:
            pr = db.get(ProcessingRequest, l.processing_request_id)
            if pr: pr.status = payload["status"]
    if "current_temperature_c" in payload and payload["current_temperature_c"] is not None:
        try:
            temp = float(payload["current_temperature_c"])
            l.current_temperature_c = temp
            alert = l.cold_chain_required and (temp < -2 or temp > 6)
            db.add(TemperatureLog(logistics_id=l.id, temperature_c=temp, alert=alert, note="Updated by admin"))
        except Exception:
            pass
    db.commit()
    return {"ok": True}


@router.get("/api/vehicles")
def vehicles(user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Vehicle).all()
    return {"vehicles": [{
        "id": v.id, "registration_number": v.registration_number, "vehicle_type": v.vehicle_type,
        "capacity_kg": v.capacity_kg, "cold_chain_capable": v.cold_chain_capable,
        "driver_name": v.driver_name, "driver_phone": v.driver_phone, "status": v.status
    } for v in rows]}
