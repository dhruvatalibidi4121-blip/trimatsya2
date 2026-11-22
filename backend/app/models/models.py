from __future__ import annotations
from datetime import datetime, date
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text, Numeric, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db.session import Base


def now():
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True, index=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(30), nullable=False, index=True)  # fisherman,buyer,processing_partner,admin
    language: Mapped[str] = mapped_column(String(10), default="en")
    location: Mapped[str | None] = mapped_column(String(160))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    fisherman: Mapped["Fisherman | None"] = relationship(back_populates="user", uselist=False)
    buyer: Mapped["Buyer | None"] = relationship(back_populates="user", uselist=False)
    processing_partner: Mapped["ProcessingPartner | None"] = relationship(back_populates="user", uselist=False)
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


class Fisherman(Base):
    __tablename__ = "fishermen"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    harbour: Mapped[str | None] = mapped_column(String(160))
    vessel_name: Mapped[str | None] = mapped_column(String(120))
    license_number: Mapped[str | None] = mapped_column(String(120))
    bank_account: Mapped[str | None] = mapped_column(String(120))
    ifsc: Mapped[str | None] = mapped_column(String(40))
    upi_id: Mapped[str | None] = mapped_column(String(120))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped[User] = relationship(back_populates="fisherman")
    catches: Mapped[list["CatchListing"]] = relationship(back_populates="fisherman")


class Buyer(Base):
    __tablename__ = "buyers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    business_name: Mapped[str | None] = mapped_column(String(160))
    business_type: Mapped[str | None] = mapped_column(String(80))  # restaurant, hotel, retailer, seafood_company
    gst_number: Mapped[str | None] = mapped_column(String(60))
    delivery_address: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship(back_populates="buyer")
    orders: Mapped[list["Order"]] = relationship(back_populates="buyer")


class ProcessingPartner(Base):
    __tablename__ = "processing_partners"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    organization_name: Mapped[str | None] = mapped_column(String(160))
    partner_type: Mapped[str | None] = mapped_column(String(80))  # fishmeal, fish_oil, fertilizer, biomedical
    license_number: Mapped[str | None] = mapped_column(String(120))
    facility_location: Mapped[str | None] = mapped_column(String(160))

    user: Mapped[User] = relationship(back_populates="processing_partner")
    processing_requests: Mapped[list["ProcessingRequest"]] = relationship(back_populates="partner")


class FishSpecies(Base):
    __tablename__ = "fish_species"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    local_name: Mapped[str | None] = mapped_column(String(120))
    image_url: Mapped[str | None] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(40), default="fresh")  # fresh/waste


class CatchListing(Base):
    __tablename__ = "catch_listings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fisherman_id: Mapped[int] = mapped_column(ForeignKey("fishermen.id"), index=True)
    species_id: Mapped[int | None] = mapped_column(ForeignKey("fish_species.id"), nullable=True)
    species_name: Mapped[str] = mapped_column(String(120), index=True)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    available_kg: Mapped[float] = mapped_column(Float, nullable=False)
    catch_date: Mapped[datetime | None] = mapped_column(DateTime)
    landing_location: Mapped[str] = mapped_column(String(160))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    condition: Mapped[str] = mapped_column(String(40), default="Fresh")  # Fresh,Damaged,Non-food-grade,Requires inspection
    expected_price_per_kg: Mapped[float] = mapped_column(Float, default=0)
    availability: Mapped[str] = mapped_column(String(40), default="available")
    notes: Mapped[str | None] = mapped_column(Text)
    verification_status: Mapped[str] = mapped_column(String(40), default="pending")  # pending,verified,rejected
    quality_status: Mapped[str] = mapped_column(String(40), default="unverified")
    verified_weight_kg: Mapped[float | None] = mapped_column(Float)
    is_waste: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    waste_category: Mapped[str | None] = mapped_column(String(80))  # fishmeal, fish_oil, fertilizer, biomedical
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    fisherman: Mapped[Fisherman] = relationship(back_populates="catches")
    photos: Mapped[list["CatchPhoto"]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    inspections: Mapped[list["QualityInspection"]] = relationship(back_populates="catch_listing")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="catch_listing")


class CatchPhoto(Base):
    __tablename__ = "catch_photos"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    catch_listing_id: Mapped[int] = mapped_column(ForeignKey("catch_listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    listing: Mapped[CatchListing] = relationship(back_populates="photos")


class MarketPrice(Base):
    __tablename__ = "market_prices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    species_id: Mapped[int | None] = mapped_column(ForeignKey("fish_species.id"), nullable=True)
    species_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    local_name: Mapped[str | None] = mapped_column(String(120))
    estimated_price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("buyers.id"), index=True)
    order_type: Mapped[str] = mapped_column(String(30), default="fresh")  # fresh/waste/procurement
    status: Mapped[str] = mapped_column(String(40), default="Requested", index=True)
    total_quantity_kg: Mapped[float] = mapped_column(Float, default=0)
    gross_value: Mapped[float] = mapped_column(Float, default=0)
    fisherman_payout: Mapped[float] = mapped_column(Float, default=0)
    platform_fee: Mapped[float] = mapped_column(Float, default=0)
    logistics_charges: Mapped[float] = mapped_column(Float, default=0)
    delivery_location: Mapped[str] = mapped_column(String(160))
    delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    buyer: Mapped[Buyer] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    logistics: Mapped[list["Logistics"]] = relationship(back_populates="order")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order")
    transaction_history: Mapped[list["TransactionHistory"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    catch_listing_id: Mapped[int] = mapped_column(ForeignKey("catch_listings.id"), index=True)
    fisherman_id: Mapped[int] = mapped_column(ForeignKey("fishermen.id"), index=True)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    platform_fee: Mapped[float] = mapped_column(Float, default=0)
    logistics_charge: Mapped[float] = mapped_column(Float, default=0)
    payout_amount: Mapped[float] = mapped_column(Float, default=0)

    order: Mapped[Order] = relationship(back_populates="items")
    catch_listing: Mapped[CatchListing] = relationship(back_populates="order_items")


class AggregatedCatch(Base):
    __tablename__ = "aggregated_catches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    species_name: Mapped[str] = mapped_column(String(120))
    requested_quantity_kg: Mapped[float] = mapped_column(Float)
    aggregated_quantity_kg: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(40), default="aggregating")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class QualityInspection(Base):
    __tablename__ = "quality_inspections"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    catch_listing_id: Mapped[int | None] = mapped_column(ForeignKey("catch_listings.id"), nullable=True)
    waste_listing_id: Mapped[int | None] = mapped_column(ForeignKey("waste_listings.id"), nullable=True)
    inspector_name: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(40), default="pending")  # pending,approved,rejected
    notes: Mapped[str | None] = mapped_column(Text)
    inspected_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    catch_listing: Mapped[CatchListing | None] = relationship(back_populates="inspections")
    waste_listing: Mapped["WasteListing | None"] = relationship(back_populates="inspections")


class WasteListing(Base):
    __tablename__ = "waste_listings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fisherman_id: Mapped[int] = mapped_column(ForeignKey("fishermen.id"), index=True)
    material_type: Mapped[str] = mapped_column(String(120))  # byproduct/offcuts/viscera etc
    species_name: Mapped[str | None] = mapped_column(String(120))
    quantity_kg: Mapped[float] = mapped_column(Float)
    available_kg: Mapped[float] = mapped_column(Float)
    condition: Mapped[str] = mapped_column(String(80), default="Non-food-grade")
    category: Mapped[str] = mapped_column(String(80), index=True)  # fishmeal, fish_oil, fertilizer, biomedical
    collection_location: Mapped[str] = mapped_column(String(160))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    inspection_status: Mapped[str] = mapped_column(String(40), default="pending")  # pending,approved,rejected
    suitability_status: Mapped[str] = mapped_column(String(40), default="awaiting_inspection")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    inspections: Mapped[list[QualityInspection]] = relationship(back_populates="waste_listing")
    processing_requests: Mapped[list["ProcessingRequest"]] = relationship(back_populates="waste_listing")


class ProcessingRequest(Base):
    __tablename__ = "processing_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    waste_listing_id: Mapped[int] = mapped_column(ForeignKey("waste_listings.id"), index=True)
    partner_id: Mapped[int] = mapped_column(ForeignKey("processing_partners.id"), index=True)
    quantity_kg: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(40), default="Requested", index=True)
    requested_collection_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    waste_listing: Mapped[WasteListing] = relationship(back_populates="processing_requests")
    partner: Mapped[ProcessingPartner] = relationship(back_populates="processing_requests")
    logistics: Mapped[list["Logistics"]] = relationship(back_populates="processing_request")


class Logistics(Base):
    __tablename__ = "logistics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    processing_request_id: Mapped[int | None] = mapped_column(ForeignKey("processing_requests.id"), nullable=True, index=True)
    workflow_type: Mapped[str] = mapped_column(String(30), default="fresh")  # fresh/waste
    pickup_location: Mapped[str] = mapped_column(String(160))
    destination_location: Mapped[str] = mapped_column(String(160))
    pickup_time: Mapped[datetime | None] = mapped_column(DateTime)
    delivery_time: Mapped[datetime | None] = mapped_column(DateTime)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id"), nullable=True)
    driver_name: Mapped[str | None] = mapped_column(String(120))
    driver_phone: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(40), default="Requested")
    cold_chain_required: Mapped[bool] = mapped_column(Boolean, default=True)
    current_temperature_c: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    order: Mapped[Order | None] = relationship(back_populates="logistics")
    processing_request: Mapped[ProcessingRequest | None] = relationship(back_populates="logistics")
    vehicle: Mapped["Vehicle | None"] = relationship(back_populates="logistics_records")
    temperature_logs: Mapped[list["TemperatureLog"]] = relationship(back_populates="logistics", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    registration_number: Mapped[str] = mapped_column(String(60), unique=True)
    vehicle_type: Mapped[str] = mapped_column(String(60))
    capacity_kg: Mapped[float | None] = mapped_column(Float)
    cold_chain_capable: Mapped[bool] = mapped_column(Boolean, default=False)
    driver_name: Mapped[str | None] = mapped_column(String(120))
    driver_phone: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), default="available")

    logistics_records: Mapped[list[Logistics]] = relationship(back_populates="vehicle")


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    fisherman_id: Mapped[int | None] = mapped_column(ForeignKey("fishermen.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    fee_amount: Mapped[float] = mapped_column(Float, default=0)
    logistics_amount: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(40), default="Pending")
    method: Mapped[str] = mapped_column(String(40), default="bank_transfer")
    reference: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    order: Mapped[Order] = relationship(back_populates="payments")


class PlatformFee(Base):
    __tablename__ = "platform_fees"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    fee_type: Mapped[str] = mapped_column(String(40), default="percentage")  # percentage/fixed
    value: Mapped[float] = mapped_column(Float, nullable=False)
    applies_to: Mapped[str] = mapped_column(String(40), default="fresh")  # fresh/waste/all
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(40), default="info")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    user: Mapped[User | None] = relationship(back_populates="notifications")


class TemperatureLog(Base):
    __tablename__ = "temperature_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    logistics_id: Mapped[int] = mapped_column(ForeignKey("logistics.id", ondelete="CASCADE"), index=True)
    temperature_c: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    alert: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(String(255))

    logistics: Mapped[Logistics] = relationship(back_populates="temperature_logs")


class TransactionHistory(Base):
    __tablename__ = "transaction_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(60))
    amount: Mapped[float | None] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    order: Mapped[Order | None] = relationship(back_populates="transaction_history")


class OtpRequest(Base):
    __tablename__ = "otp_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(30), index=True)
    code_hash: Mapped[str] = mapped_column(String(255))
    purpose: Mapped[str] = mapped_column(String(30), default="login")
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    consumed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


Index("ix_catch_species_avail", CatchListing.species_name, CatchListing.availability)
Index("ix_waste_cat_status", WasteListing.category, WasteListing.inspection_status)
