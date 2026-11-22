from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db.session import get_db
from ..core.deps import get_current_user, require_roles, get_current_user_optional
from ..models.models import CatchListing, CatchPhoto, Fisherman, MarketPrice, FishSpecies, User
from ..schemas.schemas import CatchCreate
from ..services.utils import save_image, public_user, coords_for, SPECIES_IMAGES, money

router = APIRouter()


def listing_to_market(l: CatchListing, db: Session):
    user = db.query(User).join(Fisherman, Fisherman.user_id == User.id).filter(Fisherman.id == l.fisherman_id).first()
    photo = l.photos[0].url if l.photos else SPECIES_IMAGES.get(l.species_name, "/images/fish-market-vizag.jpg")
    mp = db.query(MarketPrice).filter(MarketPrice.species_name == l.species_name).first()
    is_waste_like = l.is_waste or l.condition in ("Damaged", "Non-food-grade")
    ltype = "waste" if is_waste_like else "fresh"
    return {
        "id": l.id,
        "type": ltype,
        "species": l.species_name,
        "local_name": db.query(FishSpecies).filter(FishSpecies.name == l.species_name).first().local_name if db.query(FishSpecies).filter(FishSpecies.name == l.species_name).first() else None,
        "quantity_kg": l.available_kg,
        "item_condition": l.condition,
        "location": l.landing_location,
        "price_per_kg": l.expected_price_per_kg,
        "image": photo,
        "description": l.notes or "",
        "category": l.waste_category or ("Fresh fish" if ltype == "fresh" else "By-product"),
        "verified": l.verification_status == "verified",
        "status": l.availability,
        "seller_name": user.name if user else "Fisherman",
        "seller_phone": user.phone if user else None,
        "market_price": mp.estimated_price_per_kg if mp else l.expected_price_per_kg,
        "created_at": l.created_at.isoformat() if l.created_at else None,
        "quality_status": l.quality_status,
        "catch_date": l.catch_date.isoformat() if l.catch_date else None,
    }


@router.get("/marketplace")
@router.get("/api/listings")
def marketplace(
    type: str | None = Query(None),
    species: str | None = None,
    location: str | None = None,
    q: str | None = None,
    quality: str | None = None,
    sort: str | None = "new",
    db: Session = Depends(get_db),
):
    # Dedicated waste marketplace records
    if type == "waste":
        from ..models.models import WasteListing
        wq = db.query(WasteListing)
        if species:
            wq = wq.filter(or_(WasteListing.species_name.ilike(f"%{species}%"), WasteListing.material_type.ilike(f"%{species}%")))
        if location:
            wq = wq.filter(WasteListing.collection_location.ilike(f"%{location}%"))
        if q:
            like = f"%{q}%"
            wq = wq.filter(or_(WasteListing.material_type.ilike(like), WasteListing.category.ilike(like), WasteListing.collection_location.ilike(like), WasteListing.species_name.ilike(like)))
        if quality == "verified":
            wq = wq.filter(WasteListing.inspection_status == "approved")
        wrows = []
        for w in wq.order_by(WasteListing.id.desc()).all():
            fisher = db.get(Fisherman, w.fisherman_id)
            fuser = db.get(User, fisher.user_id) if fisher else None
            wrows.append({
                "id": w.id,
                "type": "waste",
                "species": w.species_name or w.material_type,
                "local_name": None,
                "quantity_kg": w.available_kg,
                "item_condition": w.condition,
                "location": w.collection_location,
                "price_per_kg": 0,
                "image": w.photo_url or "/images/fish-processing.jpg",
                "description": w.notes or "",
                "category": w.category,
                "verified": w.inspection_status == "approved",
                "status": "approved" if w.inspection_status == "approved" else ("in inspection" if w.inspection_status == "pending" else w.inspection_status),
                "seller_name": fuser.name if fuser else "Fisherman",
                "seller_phone": fuser.phone if fuser else None,
                "market_price": 0,
                "created_at": w.created_at.isoformat() if w.created_at else None,
            })
        return {"listings": wrows}

    query = db.query(CatchListing)
    # Fresh marketplace must not include non-food-grade/spoiled suitability-unclear items as consumable
    if type == "fresh" or type is None:
        query = query.filter(CatchListing.is_waste == False, CatchListing.condition.in_(["Fresh", "Requires inspection"]))
    if species:
        query = query.filter(CatchListing.species_name.ilike(f"%{species}%"))
    if location:
        query = query.filter(CatchListing.landing_location.ilike(f"%{location}%"))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(CatchListing.species_name.ilike(like), CatchListing.landing_location.ilike(like), CatchListing.notes.ilike(like)))
    if quality == "verified":
        query = query.filter(CatchListing.verification_status == "verified")
    listings = query.all()
    rows = [listing_to_market(l, db) for l in listings if l.available_kg > 0 and l.availability == "available"]
    if sort == "price-asc":
        rows.sort(key=lambda x: x["price_per_kg"])
    elif sort == "price-desc":
        rows.sort(key=lambda x: x["price_per_kg"], reverse=True)
    elif sort == "quantity":
        rows.sort(key=lambda x: x["quantity_kg"], reverse=True)
    else:
        rows.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return {"listings": rows}


@router.get("/marketplace/{id}")
@router.get("/api/listings/{id}")
def marketplace_detail(id: int, db: Session = Depends(get_db)):
    l = db.get(CatchListing, id)
    if not l:
        raise HTTPException(404, "Listing not found.")
    return {"listing": listing_to_market(l, db)}


@router.post("/catches")
@router.post("/api/listings")
async def create_catch(payload: CatchCreate, user=Depends(require_roles("fisherman", "admin")), db: Session = Depends(get_db)):
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if not fisher and user.role == "admin":
        # allow admin demo by attaching/creating a fisherman profile
        fisher = db.query(Fisherman).first()
    if not fisher:
        raise HTTPException(400, "Fisherman profile not found.")
    loc = payload.landing_location or payload.location or user.location or "Mangaluru Fishing Harbour"
    lat, lng = payload.lat, payload.lng
    if lat is None or lng is None:
        lat, lng = coords_for(loc)
    is_waste = bool(payload.is_waste or payload.condition == "Non-food-grade" or (payload.type or "").lower() == "waste")
    price = payload.expected_price if payload.expected_price else (payload.price or 0)
    notes = payload.notes or payload.description
    # Non-food-grade must not enter fresh marketplace
    listing = CatchListing(
        fisherman_id=fisher.id,
        species_name=payload.species,
        quantity_kg=payload.quantity,
        available_kg=payload.quantity,
        catch_date=payload.catch_date or datetime.utcnow(),
        landing_location=loc,
        lat=lat, lng=lng,
        condition=payload.condition,
        expected_price_per_kg=float(price or 0),
        availability="available" if not is_waste else "registered",
        notes=notes,
        verification_status="pending",
        quality_status="unverified",
        is_waste=is_waste,
        waste_category=payload.waste_category if is_waste else None,
    )
    db.add(listing); db.flush()
    fallback = SPECIES_IMAGES.get(payload.species, "/images/fish-market-vizag.jpg")
    img = await save_image(payload.image, fallback=fallback)
    db.add(CatchPhoto(catch_listing_id=listing.id, url=img))
    db.commit(); db.refresh(listing)
    return {"listing": listing_to_market(listing, db), "message": "Catch listed successfully."}


@router.get("/catches/my-listings")
@router.get("/api/my-listings")
def my_listings(user=Depends(get_current_user), db: Session = Depends(get_db)):
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if not fisher:
        return {"listings": []}
    rows = db.query(CatchListing).filter(CatchListing.fisherman_id == fisher.id).order_by(CatchListing.id.desc()).all()
    return {"listings": [listing_to_market(l, db) for l in rows]}


@router.patch("/catches/{id}")
@router.patch("/api/listings/{id}")
def update_listing(id: int, payload: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.get(CatchListing, id)
    if not listing:
        raise HTTPException(404, "Listing not found.")
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if user.role != "admin" and (not fisher or listing.fisherman_id != fisher.id):
        raise HTTPException(403, "Not allowed.")
    # updatable fields
    for key in ["availability", "notes"]:
        if key in payload and payload[key] is not None:
            setattr(listing, key if key != "notes" else "notes", payload[key])
    if "quantity_kg" in payload:
        try:
            q = float(payload["quantity_kg"])
            listing.quantity_kg = q
            listing.available_kg = q
        except Exception:
            pass
    if "price_per_kg" in payload or "expected_price_per_kg" in payload:
        listing.expected_price_per_kg = float(payload.get("price_per_kg") or payload.get("expected_price_per_kg") or listing.expected_price_per_kg)
    if "status" in payload:
        listing.availability = payload["status"]
    if user.role == "admin":
        if "verified" in payload:
            listing.verification_status = "verified" if payload["verified"] else "pending"
            listing.quality_status = "verified" if payload["verified"] else listing.quality_status
        if "verification_status" in payload:
            listing.verification_status = payload["verification_status"]
    db.commit(); db.refresh(listing)
    return {"listing": listing_to_market(listing, db)}


@router.delete("/api/listings/{id}")
def delete_listing(id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.get(CatchListing, id)
    if not listing:
        raise HTTPException(404, "Listing not found.")
    fisher = db.query(Fisherman).filter(Fisherman.user_id == user.id).first()
    if user.role != "admin" and (not fisher or listing.fisherman_id != fisher.id):
        raise HTTPException(403, "Not allowed.")
    db.delete(listing); db.commit()
    return {"ok": True}


@router.get("/api/market-prices")
@router.get("/market-prices")
def market_prices(db: Session = Depends(get_db)):
    rows = db.query(MarketPrice).order_by(MarketPrice.species_name).all()
    return {"prices": [
        {"id": r.id, "species": r.species_name, "local_name": r.local_name, "price_per_kg": r.estimated_price_per_kg, "updated_at": r.updated_at.isoformat() if r.updated_at else None}
        for r in rows
    ]}


@router.get("/api/processing-partners")
def processing_partners_public(db: Session = Depends(get_db)):
    partners = db.query(ProcessingPartner).all()
    out = []
    for p in partners:
        u = db.get(User, p.user_id)
        reqs = db.query(ProcessingRequest).filter(ProcessingRequest.partner_id == p.id).all()
        out.append({
            "id": p.id,
            "name": p.organization_name or (u.name if u else "Partner"),
            "location": p.facility_location or (u.location if u else ""),
            "email": u.email if u else None,
            "phone": u.phone if u else None,
            "categories": [p.partner_type] if p.partner_type else [],
            "request_count": len(reqs),
            "delivered_count": len([r for r in reqs if r.status == "Delivered"]),
        })
    return {"partners": out}
