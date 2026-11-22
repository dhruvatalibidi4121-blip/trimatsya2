from __future__ import annotations
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from ..models.models import (
    User, Fisherman, Buyer, ProcessingPartner, FishSpecies, CatchListing, CatchPhoto,
    MarketPrice, Order, OrderItem, AggregatedCatch, QualityInspection, WasteListing,
    ProcessingRequest, Logistics, Vehicle, Payment, PlatformFee, TemperatureLog,
    TransactionHistory, Notification
)
from ..core.security import hash_password
from .utils import money, coords_for

SPECIES = [
    ("Indian Mackerel", "Bangude", "/images/mackerel.jpg", 180),
    ("Sardines", "Mathi", "/images/fish-market-ram.jpg", 120),
    ("Seer Fish", "Anjal", "/images/seer-fish.jpg", 650),
    ("Pomfret", "Manji", "/images/pomfret.jpg", 750),
    ("Prawns", "Yetti", "/images/prawns.jpg", 420),
    ("Tuna", "Gedda", "/images/tuna.jpg", 260),
    ("Anchovies", "Koddai", "/images/anchovies.jpg", 140),
]


def seed_if_empty(db: Session):
    if db.query(User).first():
        return

    for name, local, img, price in SPECIES:
        db.add(FishSpecies(name=name, local_name=local, image_url=img, category="fresh"))
        db.add(MarketPrice(species_name=name, local_name=local, estimated_price_per_kg=price, updated_at=datetime.utcnow()))

    db.add_all([
        PlatformFee(name="Fresh marketplace fee", fee_type="percentage", value=2.0, applies_to="fresh", active=True),
        PlatformFee(name="Logistics base (per kg)", fee_type="fixed", value=4.0, applies_to="all", active=True),
    ])

    vehicles = [
        Vehicle(registration_number="KA-19-F-1021", vehicle_type="Insulated truck", capacity_kg=1200, cold_chain_capable=True, driver_name="Suresh Naik", driver_phone="9876543210"),
        Vehicle(registration_number="KA-19-F-2088", vehicle_type="Mini pickup", capacity_kg=600, cold_chain_capable=True, driver_name="Ramesh Poojary", driver_phone="9876501234"),
        Vehicle(registration_number="KA-19-F-3344", vehicle_type="Waste collection van", capacity_kg=800, cold_chain_capable=False, driver_name="Imran", driver_phone="9898989898"),
    ]
    db.add_all(vehicles)
    db.flush()

    def mk_user(name, role, email=None, phone=None, location=None, password="demo123", lang="en", verified=True):
        lat, lng = coords_for(location)
        u = User(name=name, email=email, phone=phone, role=role, location=location, lat=lat, lng=lng,
                 password_hash=hash_password(password) if password else None, language=lang, is_verified=verified)
        db.add(u); db.flush()
        return u

    admin = mk_user("TRI-MATSYA Admin", "admin", email="admin@trimatsya.in", phone="9000000000", location="Mangaluru", password="admin123")
    ravi_u = mk_user("Ravi K", "fisherman", email="ravi@trimatsya.in", phone="9876500001", location="Mangaluru Fishing Harbour", password="fisher123", lang="kn")
    laxmi_u = mk_user("Laxmi", "fisherman", email="laxmi@trimatsya.in", phone="9876500002", location="Bunder", password="fisher123", lang="kn")
    anil_u = mk_user("Anil", "fisherman", email="anil@trimatsya.in", phone="9876500003", location="Ullal", password="fisher123", lang="ml")
    coastal_u = mk_user("Coastal Spice Restaurant", "buyer", email="buyer@trimatsya.in", phone="9876510001", location="Mangaluru", password="buyer123")
    ocean_u = mk_user("Ocean Fresh Retail", "buyer", email="buyer2@trimatsya.in", phone="9876510002", location="Surathkal", password="buyer123")
    blue_u = mk_user("BlueWave Processors", "processing_partner", email="processor@trimatsya.in", phone="9876520001", location="Baikampady Industrial Area", password="partner123")
    green_u = mk_user("GreenSoil Fertilizers", "processing_partner", email="fertilizer@trimatsya.in", phone="9876520002", location="Kuloor", password="partner123")

    # Compatibility demo accounts matching existing frontend quick-login
    demo_ravi = mk_user("Ravi Poojary", "fisherman", email="ravi@demo.in", phone="9448010001", location="Mangaluru Harbour", password="fish123", lang="kn")
    demo_buyer = mk_user("Coastal Spice Restaurant", "buyer", email="buyer@demo.in", phone="9845020001", location="Mangaluru", password="buyer123")
    demo_proc = mk_user("Ocean Agri Industries", "processing_partner", email="processor@demo.in", phone="9845030001", location="Baikampady Industrial Area", password="process123")
    db.flush()

    f1 = Fisherman(user_id=ravi_u.id, harbour="Mangaluru Fishing Harbour", vessel_name="Sea Star", license_number="KA-FISH-201", verified_at=datetime.utcnow())
    f2 = Fisherman(user_id=laxmi_u.id, harbour="Bunder", vessel_name="Nethravathi", license_number="KA-FISH-202", verified_at=datetime.utcnow())
    f3 = Fisherman(user_id=anil_u.id, harbour="Ullal", vessel_name="Sagara Rani", license_number="KA-FISH-203", verified_at=datetime.utcnow())
    f4 = Fisherman(user_id=demo_ravi.id, harbour="Mangaluru Harbour", vessel_name="Matsya", license_number="KA-FISH-204", verified_at=datetime.utcnow())
    b1 = Buyer(user_id=coastal_u.id, business_name="Coastal Spice Restaurant", business_type="restaurant", delivery_address="Hampankatta, Mangaluru")
    b2 = Buyer(user_id=ocean_u.id, business_name="Ocean Fresh Retail", business_type="retailer", delivery_address="Surathkal, Mangaluru")
    b3 = Buyer(user_id=demo_buyer.id, business_name="Coastal Spice Restaurant", business_type="restaurant", delivery_address="Mangaluru")
    p1 = ProcessingPartner(user_id=blue_u.id, organization_name="BlueWave Processors", partner_type="fishmeal", license_number="PROC-441", facility_location="Baikampady Industrial Area")
    p2 = ProcessingPartner(user_id=green_u.id, organization_name="GreenSoil Fertilizers", partner_type="fertilizer", license_number="PROC-442", facility_location="Kuloor")
    p3 = ProcessingPartner(user_id=demo_proc.id, organization_name="Ocean Agri Industries", partner_type="fishmeal", license_number="PROC-443", facility_location="Baikampady Industrial Area")
    db.add_all([f1, f2, f3, f4, b1, b2, b3, p1, p2, p3])
    db.flush()

    listings_data = [
        (f1, "Indian Mackerel", 120, "Fresh", "Mangaluru Fishing Harbour", 175, "/images/mackerel.jpg", "verified", "available", 0),
        (f2, "Sardines", 90, "Fresh", "Bunder", 115, "/images/fish-market-ram.jpg", "verified", "available", 0),
        (f3, "Seer Fish", 45, "Fresh", "Ullal", 640, "/images/seer-fish.jpg", "verified", "available", 0),
        (f1, "Pomfret", 30, "Fresh", "Mangaluru Fishing Harbour", 740, "/images/pomfret.jpg", "pending", "available", 0),
        (f2, "Prawns", 55, "Fresh", "Bunder", 410, "/images/prawns.jpg", "verified", "available", 0),
        (f3, "Tuna", 70, "Fresh", "Ullal", 250, "/images/tuna.jpg", "verified", "available", 0),
    ]
    catch_objs = []
    for fisher, species, qty, cond, loc, price, img, ver, avail, sold in listings_data:
        lat, lng = coords_for(loc)
        c = CatchListing(
            fisherman_id=fisher.id, species_name=species, quantity_kg=qty, available_kg=qty - sold,
            catch_date=datetime.utcnow() - timedelta(hours=6), landing_location=loc, lat=lat, lng=lng,
            condition=cond, expected_price_per_kg=price, availability=avail, verification_status=ver,
            quality_status="verified" if ver == "verified" else "unverified", verified_weight_kg=qty if ver == "verified" else None,
            notes="Fresh morning catch, ice stored.", is_waste=False
        )
        db.add(c); db.flush()
        db.add(CatchPhoto(catch_listing_id=c.id, url=img))
        catch_objs.append(c)

    # Extra listings for demo fisherman (ravi@demo.in) so dashboard has data
    demo_catch_defs = [
        (f4, "Sardines", 90, "Fresh", "Mangaluru Harbour", 125, "/images/fish-market-ram.jpg", "verified", "available"),
        (f4, "Indian Mackerel", 70, "Fresh", "Mangaluru Harbour", 180, "/images/mackerel.jpg", "verified", "available"),
    ]
    demo_catch_objs = []
    for fisher, species, qty, cond, loc, price, img, ver, avail in demo_catch_defs:
        lat, lng = coords_for(loc)
        c = CatchListing(
            fisherman_id=fisher.id, species_name=species, quantity_kg=qty, available_kg=qty,
            catch_date=datetime.utcnow() - timedelta(hours=4), landing_location=loc, lat=lat, lng=lng,
            condition=cond, expected_price_per_kg=price, availability=avail, verification_status=ver,
            quality_status="verified" if ver == "verified" else "unverified", verified_weight_kg=qty if ver == "verified" else None,
            notes="Demo listing - fresh morning catch.", is_waste=False
        )
        db.add(c); db.flush()
        db.add(CatchPhoto(catch_listing_id=c.id, url=img))
        demo_catch_objs.append(c)

    # Sample delivered/active orders for analytics/demo accounts (sums-rich demo data)
    order = Order(buyer_id=b1.id, order_type="fresh", status="Delivered", total_quantity_kg=80,
                  gross_value=14000, fisherman_payout=13160, platform_fee=280, logistics_charges=560,
                  delivery_location="Hampankatta, Mangaluru", delivery_date=date.today() - timedelta(days=2),
                  created_at=datetime.utcnow() - timedelta(days=5))
    db.add(order); db.flush()
    db.add(OrderItem(order_id=order.id, catch_listing_id=catch_objs[0].id, fisherman_id=f1.id, quantity_kg=80,
                     price_per_kg=175, platform_fee=280, logistics_charge=320, payout_amount=13400))
    db.add(Payment(order_id=order.id, fisherman_id=f1.id, amount=13400, fee_amount=280, logistics_amount=320, status="Paid", method="bank_transfer"))
    db.add(Logistics(order_id=order.id, workflow_type="fresh", pickup_location="Mangaluru Fishing Harbour", destination_location="Hampankatta, Mangaluru",
                     vehicle_id=vehicles[0].id, driver_name=vehicles[0].driver_name, driver_phone=vehicles[0].driver_phone,
                     status="Delivered", cold_chain_required=True, current_temperature_c=2.5,
                     pickup_time=datetime.utcnow() - timedelta(days=3), delivery_time=datetime.utcnow() - timedelta(days=2)))

    order2 = Order(buyer_id=b2.id, order_type="fresh", status="Delivered", total_quantity_kg=50,
                   gross_value=5750, fisherman_payout=5405, platform_fee=115, logistics_charges=230,
                   delivery_location="Surathkal, Mangaluru", delivery_date=date.today() - timedelta(days=4),
                   created_at=datetime.utcnow() - timedelta(days=8))
    db.add(order2); db.flush()
    db.add(OrderItem(order_id=order2.id, catch_listing_id=catch_objs[1].id, fisherman_id=f2.id, quantity_kg=50,
                     price_per_kg=115, platform_fee=115, logistics_charge=200, payout_amount=5435))
    db.add(Payment(order_id=order2.id, fisherman_id=f2.id, amount=5435, fee_amount=115, logistics_amount=200, status="Paid", method="bank_transfer"))
    db.add(Logistics(order_id=order2.id, workflow_type="fresh", pickup_location="Bunder", destination_location="Surathkal, Mangaluru",
                     vehicle_id=vehicles[1].id, driver_name=vehicles[1].driver_name, driver_phone=vehicles[1].driver_phone,
                     status="Delivered", cold_chain_required=True, current_temperature_c=3.2,
                     pickup_time=datetime.utcnow() - timedelta(days=5), delivery_time=datetime.utcnow() - timedelta(days=4)))

    order3 = Order(buyer_id=b1.id, order_type="fresh", status="In transit", total_quantity_kg=20,
                   gross_value=12800, fisherman_payout=12032, platform_fee=256, logistics_charges=512,
                   delivery_location="Hampankatta, Mangaluru", delivery_date=date.today(),
                   created_at=datetime.utcnow() - timedelta(days=1))
    db.add(order3); db.flush()
    db.add(OrderItem(order_id=order3.id, catch_listing_id=catch_objs[2].id, fisherman_id=f3.id, quantity_kg=20,
                     price_per_kg=640, platform_fee=256, logistics_charge=80, payout_amount=12464))
    db.add(Payment(order_id=order3.id, fisherman_id=f3.id, amount=12464, fee_amount=256, logistics_amount=80, status="Pending", method="bank_transfer"))
    db.add(Logistics(order_id=order3.id, workflow_type="fresh", pickup_location="Ullal", destination_location="Hampankatta, Mangaluru",
                     vehicle_id=vehicles[0].id, driver_name=vehicles[0].driver_name, driver_phone=vehicles[0].driver_phone,
                     status="In transit", cold_chain_required=True, current_temperature_c=2.9,
                     pickup_time=datetime.utcnow() - timedelta(hours=6)))

    demo_order = Order(buyer_id=b3.id, order_type="fresh", status="Confirmed", total_quantity_kg=30,
                       gross_value=5250, fisherman_payout=4935, platform_fee=105, logistics_charges=210,
                       delivery_location="Mangaluru", delivery_date=date.today() + timedelta(days=1),
                       created_at=datetime.utcnow() - timedelta(days=1))
    db.add(demo_order); db.flush()
    db.add(OrderItem(order_id=demo_order.id, catch_listing_id=catch_objs[0].id, fisherman_id=f1.id, quantity_kg=30,
                     price_per_kg=175, platform_fee=105, logistics_charge=120, payout_amount=5025))
    db.add(Payment(order_id=demo_order.id, fisherman_id=f1.id, amount=5025, fee_amount=105, logistics_amount=120, status="Pending", method="bank_transfer"))
    db.add(Logistics(order_id=demo_order.id, workflow_type="fresh", pickup_location="Mangaluru Fishing Harbour", destination_location="Mangaluru",
                     vehicle_id=vehicles[1].id, driver_name=vehicles[1].driver_name, driver_phone=vehicles[1].driver_phone,
                     status="Confirmed", cold_chain_required=True, current_temperature_c=3.0))

    demo_buyer_order2 = Order(buyer_id=b3.id, order_type="fresh", status="Delivered", total_quantity_kg=25,
                              gross_value=10250, fisherman_payout=9635, platform_fee=205, logistics_charges=410,
                              delivery_location="Mangaluru", delivery_date=date.today() - timedelta(days=6),
                              created_at=datetime.utcnow() - timedelta(days=10))
    db.add(demo_buyer_order2); db.flush()
    db.add(OrderItem(order_id=demo_buyer_order2.id, catch_listing_id=catch_objs[4].id, fisherman_id=f2.id, quantity_kg=25,
                     price_per_kg=410, platform_fee=205, logistics_charge=100, payout_amount=9945))
    db.add(Payment(order_id=demo_buyer_order2.id, fisherman_id=f2.id, amount=9945, fee_amount=205, logistics_amount=100, status="Paid", method="upi"))
    db.add(Logistics(order_id=demo_buyer_order2.id, workflow_type="fresh", pickup_location="Bunder", destination_location="Mangaluru",
                     vehicle_id=vehicles[0].id, driver_name=vehicles[0].driver_name, driver_phone=vehicles[0].driver_phone,
                     status="Delivered", cold_chain_required=True, current_temperature_c=2.6,
                     pickup_time=datetime.utcnow() - timedelta(days=7), delivery_time=datetime.utcnow() - timedelta(days=6)))

    db.flush()
    log = db.query(Logistics).filter(Logistics.order_id == order.id).first()
    if log:
        db.add(TemperatureLog(logistics_id=log.id, temperature_c=2.5, recorded_at=datetime.utcnow() - timedelta(days=2, hours=4), alert=False))
        db.add(TemperatureLog(logistics_id=log.id, temperature_c=3.1, recorded_at=datetime.utcnow() - timedelta(days=2, hours=2), alert=False))
        db.add(TemperatureLog(logistics_id=log.id, temperature_c=2.8, recorded_at=datetime.utcnow() - timedelta(days=2, hours=1), alert=False))
    db.add(TransactionHistory(order_id=order.id, user_id=coastal_u.id, event_type="order_completed", amount=14000, description="Delivered bulk mackerel order"))
    db.add(TransactionHistory(order_id=order2.id, user_id=ocean_u.id, event_type="order_completed", amount=5750, description="Delivered sardines order"))
    db.add(TransactionHistory(order_id=order3.id, user_id=coastal_u.id, event_type="order_in_transit", amount=12800, description="Seer fish order in transit"))
    db.add(TransactionHistory(order_id=demo_buyer_order2.id, user_id=demo_buyer.id, event_type="order_completed", amount=10250, description="Delivered prawns order (demo buyer)"))

    # Waste listings (separate module, inspection required)
    w1 = WasteListing(fisherman_id=f1.id, material_type="Fish trimmings and frames", species_name="Mixed marine fish",
                      quantity_kg=200, available_kg=80, condition="Non-food-grade", category="fishmeal",
                      collection_location="Mangaluru Fishing Harbour", lat=12.8546, lng=74.8369,
                      photo_url="/images/fishmeal-factory.jpg", inspection_status="approved", suitability_status="approved_for_authorized_processing",
                      notes="Segregated processing by-products, stored separately from food-grade catch.")
    w2 = WasteListing(fisherman_id=f2.id, material_type="Fish oil residue", species_name="Sardines",
                      quantity_kg=120, available_kg=120, condition="Non-food-grade", category="fish_oil",
                      collection_location="Bunder", lat=12.8648, lng=74.8354,
                      photo_url="/images/fish-oil-capsules.jpg", inspection_status="pending", suitability_status="awaiting_inspection",
                      notes="Requires inspection before acceptance.")
    w3 = WasteListing(fisherman_id=f3.id, material_type="Organic fish waste", species_name="Mixed",
                      quantity_kg=150, available_kg=60, condition="Non-food-grade", category="fertilizer",
                      collection_location="Ullal", lat=12.8050, lng=74.8450,
                      photo_url="/images/compost-india.jpg", inspection_status="approved", suitability_status="approved_for_composting",
                      notes="Suitable only after authorized verification.")
    w4 = WasteListing(fisherman_id=f4.id, material_type="Crab shells and offcuts", species_name="Mixed shellfish",
                      quantity_kg=90, available_kg=40, condition="Non-food-grade", category="chitin",
                      collection_location="Mangaluru Harbour", lat=12.8546, lng=74.8369,
                      photo_url="/images/fish-processing.jpg", inspection_status="approved", suitability_status="approved_for_authorized_processing",
                      notes="Demo waste listing with inspected suitability.")
    db.add_all([w1, w2, w3, w4]); db.flush()
    db.add(QualityInspection(waste_listing_id=w1.id, inspector_name="QA Team", status="approved", notes="Segregated and suitable for fishmeal.", inspected_at=datetime.utcnow()-timedelta(days=1)))
    db.add(QualityInspection(waste_listing_id=w2.id, inspector_name="QA Team", status="pending", notes="Awaiting lab/visual inspection.", inspected_at=None))
    db.add(QualityInspection(waste_listing_id=w3.id, inspector_name="QA Team", status="approved", notes="Approved for composting input.", inspected_at=datetime.utcnow()-timedelta(days=1)))
    db.add(QualityInspection(waste_listing_id=w4.id, inspector_name="QA Team", status="approved", notes="Approved for chitin extraction workflow.", inspected_at=datetime.utcnow()-timedelta(hours=12)))

    pr = ProcessingRequest(waste_listing_id=w1.id, partner_id=p1.id, quantity_kg=70, status="Delivered",
                           requested_collection_date=date.today() - timedelta(days=2), notes="Initial collection batch")
    pr2 = ProcessingRequest(waste_listing_id=w1.id, partner_id=p1.id, quantity_kg=50, status="Collected",
                            requested_collection_date=date.today(), notes="Second collection batch")
    pr3 = ProcessingRequest(waste_listing_id=w3.id, partner_id=p2.id, quantity_kg=90, status="Delivered",
                            requested_collection_date=date.today() - timedelta(days=3), notes="Composting input delivered")
    pr4 = ProcessingRequest(waste_listing_id=w4.id, partner_id=p3.id, quantity_kg=50, status="Requested",
                            requested_collection_date=date.today() + timedelta(days=1), notes="Demo processor pickup requested")
    db.add_all([pr, pr2, pr3, pr4]); db.flush()
    db.add(Logistics(processing_request_id=pr.id, workflow_type="waste", pickup_location="Mangaluru Fishing Harbour",
                     destination_location="Baikampady Industrial Area", vehicle_id=vehicles[2].id,
                     driver_name=vehicles[2].driver_name, driver_phone=vehicles[2].driver_phone,
                     status="Delivered", cold_chain_required=False, pickup_time=datetime.utcnow()-timedelta(days=3), delivery_time=datetime.utcnow()-timedelta(days=2)))
    db.add(Logistics(processing_request_id=pr2.id, workflow_type="waste", pickup_location="Mangaluru Fishing Harbour",
                     destination_location="Baikampady Industrial Area", vehicle_id=vehicles[2].id,
                     driver_name=vehicles[2].driver_name, driver_phone=vehicles[2].driver_phone,
                     status="Collected", cold_chain_required=False, pickup_time=datetime.utcnow()-timedelta(hours=8)))
    db.add(Logistics(processing_request_id=pr3.id, workflow_type="waste", pickup_location="Ullal",
                     destination_location="Kuloor", vehicle_id=vehicles[2].id,
                     driver_name=vehicles[2].driver_name, driver_phone=vehicles[2].driver_phone,
                     status="Delivered", cold_chain_required=False, pickup_time=datetime.utcnow()-timedelta(days=4), delivery_time=datetime.utcnow()-timedelta(days=3)))
    db.add(Logistics(processing_request_id=pr4.id, workflow_type="waste", pickup_location="Mangaluru Harbour",
                     destination_location="Baikampady Industrial Area", vehicle_id=vehicles[2].id,
                     driver_name=vehicles[2].driver_name, driver_phone=vehicles[2].driver_phone,
                     status="Requested", cold_chain_required=False))

    # Delivered order for demo fisherman (ravi@demo.in) so fisherman dashboard has data
    demo_fisher_order = Order(buyer_id=b1.id, order_type="fresh", status="Delivered", total_quantity_kg=40,
                              gross_value=7200, fisherman_payout=6768, platform_fee=144, logistics_charges=288,
                              delivery_location="Hampankatta, Mangaluru", delivery_date=date.today() - timedelta(days=1),
                              created_at=datetime.utcnow() - timedelta(days=3))
    db.add(demo_fisher_order); db.flush()
    db.add(OrderItem(order_id=demo_fisher_order.id, catch_listing_id=demo_catch_objs[1].id, fisherman_id=f4.id, quantity_kg=40,
                     price_per_kg=180, platform_fee=144, logistics_charge=160, payout_amount=6896))
    db.add(Payment(order_id=demo_fisher_order.id, fisherman_id=f4.id, amount=6896, fee_amount=144, logistics_amount=160, status="Paid", method="bank_transfer"))
    db.add(Logistics(order_id=demo_fisher_order.id, workflow_type="fresh", pickup_location="Mangaluru Harbour", destination_location="Hampankatta, Mangaluru",
                     vehicle_id=vehicles[0].id, driver_name=vehicles[0].driver_name, driver_phone=vehicles[0].driver_phone,
                     status="Delivered", cold_chain_required=True, current_temperature_c=2.8,
                     pickup_time=datetime.utcnow() - timedelta(days=2), delivery_time=datetime.utcnow() - timedelta(days=1)))

    demo_fisher_order2 = Order(buyer_id=b2.id, order_type="fresh", status="Delivered", total_quantity_kg=35,
                               gross_value=4375, fisherman_payout=4112.5, platform_fee=87.5, logistics_charges=175,
                               delivery_location="Surathkal, Mangaluru", delivery_date=date.today() - timedelta(days=5),
                               created_at=datetime.utcnow() - timedelta(days=9))
    db.add(demo_fisher_order2); db.flush()
    db.add(OrderItem(order_id=demo_fisher_order2.id, catch_listing_id=demo_catch_objs[0].id, fisherman_id=f4.id, quantity_kg=35,
                     price_per_kg=125, platform_fee=87.5, logistics_charge=140, payout_amount=4147.5))
    db.add(Payment(order_id=demo_fisher_order2.id, fisherman_id=f4.id, amount=4147.5, fee_amount=87.5, logistics_amount=140, status="Paid", method="upi"))
    db.add(Logistics(order_id=demo_fisher_order2.id, workflow_type="fresh", pickup_location="Mangaluru Harbour", destination_location="Surathkal, Mangaluru",
                     vehicle_id=vehicles[1].id, driver_name=vehicles[1].driver_name, driver_phone=vehicles[1].driver_phone,
                     status="Delivered", cold_chain_required=True, current_temperature_c=3.1,
                     pickup_time=datetime.utcnow() - timedelta(days=6), delivery_time=datetime.utcnow() - timedelta(days=5)))

    db.add(Notification(user_id=ravi_u.id, title="Listing verified", message="Your Indian Mackerel listing has been verified.", type="success"))
    db.add(Notification(user_id=coastal_u.id, title="Order delivered", message="Your bulk mackerel order has been delivered.", type="info"))
    db.add(Notification(user_id=ocean_u.id, title="Payment settled", message="A recent order payment has been recorded.", type="success"))
    db.add(Notification(user_id=blue_u.id, title="Waste pickup completed", message="A waste collection batch was delivered to your facility.", type="info"))
    db.add(Notification(user_id=demo_ravi.id, title="Payment received", message="Payment for your delivered order has been settled.", type="success"))
    db.add(Notification(user_id=demo_buyer.id, title="Order confirmed", message="Your demo order is confirmed for delivery.", type="info"))
    db.add(Notification(user_id=demo_proc.id, title="Pickup requested", message="A new waste pickup request is awaiting action.", type="warning"))
    from ..models.models import ContactMessage
    db.add(ContactMessage(name="Meera Shetty", email="meera@example.com", subject="Bulk supply enquiry", message="Interested in weekly 100kg sardines supply."))
    db.add(ContactMessage(name="Arun Kumar", email="arun@example.com", subject="Waste collection", message="Need details on approved fish waste pickup schedule."))

    db.commit()
