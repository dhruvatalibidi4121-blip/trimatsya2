from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import WasteListing, Fisherman, User, QualityInspection, ProcessingPartner, ProcessingRequest, Logistics, Notification
from ..schemas.schemas import WasteListingCreate, WasteInspectionIn, ProcessingRequestCreate
from ..services.utils import save_image, coords_for, money
from ..services.integrations import emit_n8n_event

router = APIRouter()

CATEGORY_IMAGES = {
    "fishmeal": "/images/fishmeal-factory.jpg",
    "fish_oil": "/images/fish-oil-capsules.jpg",
    "fertilizer": "/images/compost-india.jpg",
    "biomedical": "/images/lab-research.jpg",
}


def waste_to_dict(w: WasteListing, db: Session):
    fisher = db.get(Fisherman, w.fisherman_id)
    fuser = db.get(User, fisher.user_id) if fisher else None
    return {
        "id": w.id,
        "fisherman_id": w.fisherman_id,
        "fisherman_name": fuser.name if fuser else "",
        "material_type": w.material_type,
        "species_name": w.species_name,
        "species": w.species_name or w.material_type,
        "quantity_kg": w.quantity_kg,
        "available_kg": w.available_kg,
        "condition": w.condition,
        "category": w.category,
        "collection_location": w.collection_location,
        "location": w.collection_location,
        "photo_url": w.photo_url,
        "image": w.photo_url,
        "inspection_status": w.inspection_status,
        "suitability_status": w.suitability_status,
        "status": "approved" if w.inspection_status == "approved" else ("in inspection" if w.inspection_status == "pending" else w.inspection_status),
        "notes": w.notes,
        "created_at": w.created_at.isoformat() if w.created_at else None,
        "verified": w.inspection_status == "approved",
        "type": "waste",
        "price_per_kg": 0,
        "seller_name": fuser.name if fuser else "",
    }


@router.get("/waste/listings")
@router.get("/api/waste/listings")
def list_waste(category: str | None = None, status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(WasteListing)
    if category:
        q = q.filter(WasteListing.category == category)
    if status:
        q = q.filter(WasteListing.inspection_status == status)
    rows = q.order_by(WasteListing.id.desc()).all()
    return {"listings": [waste_to_dict(w, db) for w in rows]}


@router.post("/waste/listings")
@router.post("/api/waste/register")
async def create_waste(payload: WasteListingCreate, user=Depends(require_roles("fisherman", "admin")), db: Session = Depends(get_db)):
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if not fisher and user.role == "admin":
        fisher = db.query(Fisherman).first()
    if not fisher:
        raise HTTPException(400, "Fisherman profile not found.")
    lat, lng = coords_for(payload.collection_location)
    photo = await save_image(payload.photo_url, fallback=CATEGORY_IMAGES.get(payload.category, "/images/fish-processing.jpg"))
    w = WasteListing(
        fisherman_id=fisher.id,
        material_type=payload.material_type,
        species_name=payload.species_name,
        quantity_kg=payload.quantity_kg,
        available_kg=payload.quantity_kg,
        condition=payload.condition or "Non-food-grade",
        category=payload.category,
        collection_location=payload.collection_location,
        lat=lat, lng=lng,
        photo_url=photo,
        inspection_status="pending",
        suitability_status="awaiting_inspection",
        notes=payload.notes,
    )
    db.add(w); db.flush()
    db.add(QualityInspection(waste_listing_id=w.id, status="pending", notes="Awaiting authorized inspection"))
    db.commit(); db.refresh(w)
    emit_n8n_event("waste.listing_created", {"waste_listing_id": w.id, "fisherman_user_id": user.id, "category": w.category, "quantity_kg": w.quantity_kg, "inspection_status": w.inspection_status})
    return {"listing": waste_to_dict(w, db), "message": "Waste material registered. Inspection required before processing."}


@router.post("/waste/inspection")
async def inspect_waste(payload: WasteInspectionIn, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    w = db.get(WasteListing, payload.waste_listing_id)
    if not w: raise HTTPException(404, "Waste listing not found.")
    status = payload.status if payload.status in ("approved", "rejected", "pending") else "pending"
    w.inspection_status = status
    if status == "approved":
        w.suitability_status = "approved_for_authorized_processing"
    elif status == "rejected":
        w.suitability_status = "rejected_unsuitable"
    ins = db.query(QualityInspection).filter(QualityInspection.waste_listing_id == w.id).order_by(QualityInspection.id.desc()).first()
    if not ins:
        ins = QualityInspection(waste_listing_id=w.id)
        db.add(ins)
    ins.status = status
    ins.notes = payload.notes
    ins.inspector_name = user.name
    ins.inspected_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "listing": waste_to_dict(w, db)}


@router.post("/waste/requests")
@router.post("/api/waste/requests")
def create_processing_request(payload: ProcessingRequestCreate | dict, user=Depends(require_roles("processing_partner", "admin")), db: Session = Depends(get_db)):
    # accept both schema and legacy frontend payload
    data = payload if isinstance(payload, dict) else payload.model_dump()
    listing_id = data.get("waste_listing_id") or data.get("listingId") or data.get("listing_id")
    quantity = float(data.get("quantity_kg") or data.get("quantity") or 0)
    w = db.get(WasteListing, listing_id) if listing_id else None
    if not w:
        raise HTTPException(404, "Waste listing not found.")
    if w.inspection_status != "approved":
        raise HTTPException(400, "Material must pass inspection and be approved before collection/processing.")
    if quantity <= 0 or quantity > w.available_kg:
        raise HTTPException(400, "Invalid quantity.")
    partner = db.query(ProcessingPartner).filter(ProcessingPartner.user_id == user.id).first()
    if not partner and user.role == "admin":
        partner = db.query(ProcessingPartner).first()
    if not partner:
        raise HTTPException(400, "Processing partner profile not found.")
    pr = ProcessingRequest(
        waste_listing_id=w.id, partner_id=partner.id, quantity_kg=quantity,
        status="Requested", requested_collection_date=data.get("requested_collection_date") or data.get("scheduledAt"),
        notes=data.get("notes"),
    )
    db.add(pr); db.flush()
    w.available_kg = money(w.available_kg - quantity)
    dest = partner.facility_location or (db.get(User, partner.user_id).location if db.get(User, partner.user_id) else "Processing facility")
    db.add(Logistics(processing_request_id=pr.id, workflow_type="waste", pickup_location=w.collection_location, destination_location=dest, status="Requested", cold_chain_required=False, driver_name=data.get("transporter")))
    db.commit(); db.refresh(pr)
    emit_n8n_event("waste.request_created", {"request_id": pr.id, "waste_listing_id": w.id, "partner_id": partner.id, "quantity_kg": pr.quantity_kg, "status": pr.status})
    return {"id": pr.id, "requestId": pr.id, "message": "Processing/collection request submitted."}


def request_to_dict(pr: ProcessingRequest, db: Session):
    w = db.get(WasteListing, pr.waste_listing_id)
    partner = db.get(ProcessingPartner, pr.partner_id)
    puser = db.get(User, partner.user_id) if partner else None
    fisher = db.get(Fisherman, w.fisherman_id) if w else None
    return {
        "id": pr.id,
        "processor_id": pr.partner_id,
        "processor_name": (partner.organization_name if partner else None) or (puser.name if puser else "Processor"),
        "listing_id": pr.waste_listing_id,
        "fisherman_id": fisher.user_id if fisher else None,
        "quantity_kg": pr.quantity_kg,
        "scheduled_at": pr.requested_collection_date.isoformat() if pr.requested_collection_date else None,
        "notes": pr.notes,
        "status": pr.status,
        "species": w.species_name if w else "",
        "category": w.category if w else "",
        "image": w.photo_url if w else None,
        "location": w.collection_location if w else "",
        "created_at": pr.created_at.isoformat() if pr.created_at else None,
    }


@router.get("/api/waste/requests")
def list_waste_requests(user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(ProcessingRequest)
    if user.role == "processing_partner":
        partner = db.query(ProcessingPartner).filter(ProcessingPartner.user_id == user.id).first()
        q = q.filter(ProcessingRequest.partner_id == (partner.id if partner else -1))
    elif user.role == "fisherman":
        fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
        wids = [w.id for w in db.query(WasteListing).filter(WasteListing.fisherman_id == (fisher.id if fisher else -1)).all()]
        q = q.filter(ProcessingRequest.waste_listing_id.in_(wids)) if wids else q.filter(False)
    rows = q.order_by(ProcessingRequest.id.desc()).all()
    return {"requests": [request_to_dict(r, db) for r in rows]}


@router.patch("/api/waste/requests/{id}")
def update_waste_request(id: int, payload: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    pr = db.get(ProcessingRequest, id)
    if not pr: raise HTTPException(404, "Request not found.")
    if user.role == "processing_partner":
        partner = db.query(ProcessingPartner).filter(ProcessingPartner.user_id == user.id).first()
        if not partner or pr.partner_id != partner.id:
            raise HTTPException(403, "Not allowed.")
    if "status" in payload:
        pr.status = payload["status"]
        for l in db.query(Logistics).filter(Logistics.processing_request_id == pr.id).all():
            l.status = payload["status"]
            if payload["status"] == "Delivered":
                l.delivery_time = datetime.utcnow()
    db.commit()
    return {"ok": True}
