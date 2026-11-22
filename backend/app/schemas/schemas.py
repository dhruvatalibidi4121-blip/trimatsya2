from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = "en"


class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)
    role: str = "fisherman"
    location: Optional[str] = None
    language: Optional[str] = "en"
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    partner_type: Optional[str] = None


class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class OtpRequestIn(BaseModel):
    phone: str
    purpose: str = "login"


class OtpVerifyIn(BaseModel):
    phone: str
    code: str
    name: Optional[str] = None
    role: Optional[str] = "fisherman"
    purpose: str = "login"


class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    location: Optional[str] = None
    language: str = "en"
    is_verified: bool = False
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = None


class CatchCreate(BaseModel):
    species: str
    quantity: float = Field(gt=0)
    catch_date: Optional[datetime] = None
    landing_location: Optional[str] = None
    location: Optional[str] = None
    condition: str = "Fresh"
    expected_price: float = 0
    price: Optional[float] = None
    availability: str = "available"
    notes: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_waste: bool = False
    waste_category: Optional[str] = None
    type: Optional[str] = None


class CatchOut(BaseModel):
    id: int
    species: str
    quantity_kg: float
    available_kg: float
    landing_location: str
    condition: str
    expected_price_per_kg: float
    availability: str
    verification_status: str
    quality_status: str
    notes: Optional[str] = None
    image: Optional[str] = None
    fisherman_name: Optional[str] = None
    fisherman_phone: Optional[str] = None
    created_at: datetime


class MarketplaceListing(BaseModel):
    id: int
    type: str = "fresh"
    species: str
    local_name: Optional[str] = None
    quantity_kg: float
    item_condition: str
    location: str
    price_per_kg: float
    image: str
    description: Optional[str] = None
    category: Optional[str] = None
    verified: bool = False
    status: str = "available"
    seller_name: str
    seller_phone: Optional[str] = None
    market_price: Optional[float] = None
    created_at: Any = None


class OrderItemIn(BaseModel):
    listingId: Optional[int] = None
    catch_listing_id: Optional[int] = None
    quantity: float = Field(gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    deliveryLocation: Optional[str] = None
    delivery_location: Optional[str] = None
    delivery_date: Optional[date] = None
    notes: Optional[str] = None


class WasteListingCreate(BaseModel):
    material_type: str
    species_name: Optional[str] = None
    quantity_kg: float = Field(gt=0)
    condition: str = "Non-food-grade"
    category: str
    collection_location: str
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class WasteInspectionIn(BaseModel):
    waste_listing_id: int
    status: str
    notes: Optional[str] = None


class ProcessingRequestCreate(BaseModel):
    waste_listing_id: int
    quantity_kg: float = Field(gt=0)
    requested_collection_date: Optional[date] = None
    notes: Optional[str] = None


class LogisticsPickupIn(BaseModel):
    order_id: Optional[int] = None
    processing_request_id: Optional[int] = None
    workflow_type: str = "fresh"
    pickup_location: str
    destination_location: str
    pickup_time: Optional[datetime] = None
    vehicle_id: Optional[int] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    cold_chain_required: bool = True


class ContactIn(BaseModel):
    name: str
    email: str
    subject: Optional[str] = "General enquiry"
    message: str


class WhatsAppWebhook(BaseModel):
    phone: Optional[str] = None
    from_: Optional[str] = Field(default=None, alias="from")
    message: Optional[str] = None
    text: Optional[str] = None
    imageUrl: Optional[str] = None
    imageBase64: Optional[str] = None

    class Config:
        populate_by_name = True
