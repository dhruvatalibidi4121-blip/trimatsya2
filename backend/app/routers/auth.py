from __future__ import annotations
import random, hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db.session import get_db
from ..models.models import User, Fisherman, Buyer, ProcessingPartner, OtpRequest
from ..schemas.schemas import UserCreate, LoginRequest, OtpRequestIn, OtpVerifyIn, ProfileUpdate
from ..core.security import hash_password, verify_password, create_access_token
from ..core.deps import get_current_user, get_current_user_optional
from ..services.utils import public_user, coords_for

router = APIRouter()


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        "tm_session", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30, path="/"
    )


def ensure_role_profile(db: Session, user: User, payload: UserCreate | OtpVerifyIn | None = None):
    if user.role == "fisherman" and not db.query(Fisherman).filter_by(user_id=user.id).first():
        db.add(Fisherman(user_id=user.id, harbour=user.location))
    elif user.role == "buyer" and not db.query(Buyer).filter_by(user_id=user.id).first():
        biz = getattr(payload, "business_name", None) if payload else None
        btype = getattr(payload, "business_type", None) if payload else None
        db.add(Buyer(user_id=user.id, business_name=biz or user.name, business_type=btype or "restaurant", delivery_address=user.location))
    elif user.role == "processing_partner" and not db.query(ProcessingPartner).filter_by(user_id=user.id).first():
        org = getattr(payload, "business_name", None) if payload else None
        ptype = getattr(payload, "partner_type", None) if payload else None
        db.add(ProcessingPartner(user_id=user.id, organization_name=org or user.name, partner_type=ptype or "fishmeal", facility_location=user.location))


def normalize_role(role: str | None) -> str:
    r = (role or "fisherman").strip().lower()
    if r == "processor":
        return "processing_partner"
    if r in ("fisherman", "buyer", "processing_partner", "admin"):
        return r
    return "fisherman"


@router.post("/auth/register")
@router.post("/api/register")
def register(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower() if payload.email else None
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists.")
    if payload.phone and db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(409, "An account with this phone number already exists.")
    if not payload.password and not payload.phone:
        raise HTTPException(400, "Provide a password or mobile number.")
    role = normalize_role(payload.role)
    lat, lng = coords_for(payload.location)
    user = User(
        name=payload.name,
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password) if payload.password else None,
        role=role,
        location=payload.location,
        language=payload.language or "en",
        lat=lat, lng=lng,
        is_verified=(role == "admin")
    )
    db.add(user)
    db.flush()
    ensure_role_profile(db, user, payload)
    db.commit(); db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    set_auth_cookie(response, token)
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}


@router.post("/auth/login")
@router.post("/api/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    if not payload.password:
        raise HTTPException(400, "Password is required.")
    q = db.query(User)
    user = None
    if payload.email:
        email = payload.email.strip().lower()
        user = q.filter(User.email == email).first()
    elif payload.phone:
        user = q.filter(User.phone == payload.phone).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials.")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    set_auth_cookie(response, token)
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}


@router.post("/auth/request-otp")
@router.post("/api/auth/request-otp")
def request_otp(payload: OtpRequestIn, db: Session = Depends(get_db)):
    code = f"{random.randint(100000, 999999)}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    otp = OtpRequest(phone=payload.phone, code_hash=code_hash, purpose=payload.purpose,
                     expires_at=datetime.utcnow() + timedelta(minutes=10))
    db.add(otp); db.commit()
    # OTP-ready flow: in production integrate SMS/WhatsApp provider; here we log/return demo hint in dev
    print(f"[OTP] phone={payload.phone} code={code}")
    return {"message": "OTP sent (demo mode).", "demo_code": code, "expires_in_minutes": 10}


@router.post("/auth/verify-otp")
@router.post("/api/auth/verify-otp")
def verify_otp(payload: OtpVerifyIn, response: Response, db: Session = Depends(get_db)):
    otp = (
        db.query(OtpRequest)
        .filter(OtpRequest.phone == payload.phone, OtpRequest.purpose == payload.purpose, OtpRequest.consumed == False)
        .order_by(OtpRequest.id.desc())
        .first()
    )
    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(400, "OTP expired or not found. Request a new OTP.")
    code_hash = hashlib.sha256(payload.code.encode()).hexdigest()
    if code_hash != otp.code_hash:
        raise HTTPException(400, "Invalid OTP.")
    otp.consumed = True
    user = db.query(User).filter(User.phone == payload.phone).first()
    created = False
    if not user:
        role = normalize_role(payload.role)
        user = User(name=payload.name or f"User {payload.phone[-4:]}", phone=payload.phone, role=role, language="en", is_verified=False)
        db.add(user); db.flush()
        ensure_role_profile(db, user, payload)
        created = True
    db.commit(); db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    set_auth_cookie(response, token)
    return {"access_token": token, "token_type": "bearer", "user": public_user(user), "created": created}


@router.get("/auth/me")
@router.get("/api/me")
def me(user=Depends(get_current_user_optional)):
    return {"user": public_user(user) if user else None}


@router.post("/auth/logout")
@router.post("/api/logout")
def logout(response: Response):
    response.delete_cookie("tm_session", path="/")
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@router.patch("/auth/me")
@router.patch("/api/me")
def update_me(payload: ProfileUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    if "location" in data and data["location"]:
        lat, lng = coords_for(data["location"])
        user.lat, user.lng = lat, lng
    for k, v in data.items():
        setattr(user, k, v)
    db.commit(); db.refresh(user)
    return {"user": public_user(user)}
