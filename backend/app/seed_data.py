import datetime
import json
from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Shipment, InventoryItem, Event, Alert, Recommendation, AuditLog

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        now = datetime.datetime.utcnow()

        # 1. Shipments
        s1 = Shipment(
            id="SHP-801",
            medicine_name="Insulin Glargine 100U/mL (Lantus)",
            medicine_category="Cold-Chain Emergency",
            origin="Metro Central Depot, Sector 4",
            origin_lat=12.9716,
            origin_lng=77.5946,
            destination="St. Jude Memorial Hospital, Emergency Wing",
            destination_lat=13.0827,
            destination_lng=80.2707,
            current_location_name="Vellore Transit Corridor Checkpoint 3",
            current_lat=12.9200,
            current_lng=79.1300,
            dispatch_time=now - datetime.timedelta(hours=2),
            expected_delivery_time=now + datetime.timedelta(hours=2, minutes=30),
            current_estimated_delivery_time=now + datetime.timedelta(hours=2, minutes=45),
            shipment_status="IN_TRANSIT",
            priority="CRITICAL",
            required_quantity=200,
            available_destination_inventory=25,
            safety_stock_threshold=50,
            supplier="AeroMed Lifeline Supplies",
            current_disruption_risk=28.5,
            risk_category="Low",
            temperature_sensitive=True,
            temp_celsius=4.2,
            delay_minutes=15,
            weather_severity_score=0.15,
            road_disruption_level=0.1,
            last_updated=now
        )

        s2 = Shipment(
            id="SHP-802",
            medicine_name="Epinephrine 1mg/mL Auto-Injectors",
            medicine_category="Emergency Resuscitation",
            origin="Apollo Logistics Central, Hub 2",
            origin_lat=12.9352,
            origin_lng=77.6245,
            destination="Children's Emergency Trauma Center",
            destination_lat=13.0450,
            destination_lng=80.2400,
            current_location_name="Ranipet Highway Junction",
            current_lat=12.9250,
            current_lng=79.3300,
            dispatch_time=now - datetime.timedelta(hours=3),
            expected_delivery_time=now + datetime.timedelta(hours=1),
            current_estimated_delivery_time=now + datetime.timedelta(hours=2, minutes=20),
            shipment_status="DELAYED",
            priority="CRITICAL",
            required_quantity=150,
            available_destination_inventory=18,
            safety_stock_threshold=40,
            supplier="Apex Critical BioPharm",
            current_disruption_risk=68.0,
            risk_category="High",
            temperature_sensitive=False,
            temp_celsius=21.0,
            delay_minutes=80,
            weather_severity_score=0.65,
            road_disruption_level=0.7,
            last_updated=now
        )

        s3 = Shipment(
            id="SHP-803",
            medicine_name="Amoxicillin-Clavulanate 1000mg IV",
            medicine_category="Critical Antibiotic",
            origin="Bangalore Central Warehouse",
            origin_lat=12.9800,
            origin_lng=77.5800,
            destination="General Hospital Pulmonology Unit",
            destination_lat=12.9100,
            destination_lng=77.6000,
            current_location_name="Hosur Road Flyover Approach",
            current_lat=12.9400,
            current_lng=77.5900,
            dispatch_time=now - datetime.timedelta(minutes=45),
            expected_delivery_time=now + datetime.timedelta(hours=1),
            current_estimated_delivery_time=now + datetime.timedelta(hours=1, minutes=10),
            shipment_status="IN_TRANSIT",
            priority="HIGH",
            required_quantity=500,
            available_destination_inventory=90,
            safety_stock_threshold=60,
            supplier="Cipla LifeCare Logistics",
            current_disruption_risk=18.0,
            risk_category="Low",
            temperature_sensitive=False,
            temp_celsius=23.0,
            delay_minutes=10,
            weather_severity_score=0.1,
            road_disruption_level=0.05,
            last_updated=now
        )

        s4 = Shipment(
            id="SHP-804",
            medicine_name="Packed Red Blood Cells (O-Negative)",
            medicine_category="Cold-Chain Emergency",
            origin="Regional Blood Bank Cryo-Depot",
            origin_lat=13.0600,
            origin_lng=80.2500,
            destination="University Trauma Hospital",
            destination_lat=13.0000,
            destination_lng=80.2000,
            current_location_name="Guindy Expressway Arterial",
            current_lat=13.0100,
            current_lng=80.2100,
            dispatch_time=now - datetime.timedelta(minutes=25),
            expected_delivery_time=now + datetime.timedelta(minutes=35),
            current_estimated_delivery_time=now + datetime.timedelta(minutes=35),
            shipment_status="IN_TRANSIT",
            priority="CRITICAL",
            required_quantity=40,
            available_destination_inventory=8,
            safety_stock_threshold=20,
            supplier="National Transfusion Logistics",
            current_disruption_risk=32.0,
            risk_category="Moderate",
            temperature_sensitive=True,
            temp_celsius=3.8,
            delay_minutes=0,
            weather_severity_score=0.2,
            road_disruption_level=0.1,
            last_updated=now
        )

        s5 = Shipment(
            id="SHP-805",
            medicine_name="Norepinephrine Bitartrate 4mg/4mL",
            medicine_category="Emergency Resuscitation",
            origin="Medico Logistics Terminal 1",
            origin_lat=12.9100,
            origin_lng=77.6500,
            destination="St. Jude Memorial Hospital, Emergency Wing",
            destination_lat=13.0827,
            destination_lng=80.2707,
            current_location_name="Kanchipuram Outer Ring Corridor",
            current_lat=12.8342,
            current_lng=79.7036,
            dispatch_time=now - datetime.timedelta(hours=4),
            expected_delivery_time=now + datetime.timedelta(hours=1),
            current_estimated_delivery_time=now + datetime.timedelta(hours=3, minutes=15),
            shipment_status="DELAYED",
            priority="CRITICAL",
            required_quantity=120,
            available_destination_inventory=12,
            safety_stock_threshold=30,
            supplier="AeroMed Lifeline Supplies",
            current_disruption_risk=84.5,
            risk_category="Critical",
            temperature_sensitive=False,
            temp_celsius=22.0,
            delay_minutes=135,
            weather_severity_score=0.8,
            road_disruption_level=0.9,
            last_updated=now
        )

        s6 = Shipment(
            id="SHP-806",
            medicine_name="Snake Antivenom Polyvalent 10mL",
            medicine_category="Emergency Antidote",
            origin="District Medical Depot South",
            origin_lat=12.8500,
            origin_lng=77.6000,
            destination="Rural Community Health Hub",
            destination_lat=12.6000,
            destination_lng=77.8000,
            current_location_name="Anekal Radial Route",
            current_lat=12.7100,
            current_lng=77.7000,
            dispatch_time=now - datetime.timedelta(hours=1),
            expected_delivery_time=now + datetime.timedelta(hours=1, minutes=15),
            current_estimated_delivery_time=now + datetime.timedelta(hours=1, minutes=15),
            shipment_status="IN_TRANSIT",
            priority="HIGH",
            required_quantity=50,
            available_destination_inventory=4,
            safety_stock_threshold=10,
            supplier="Serum Institute Distribution",
            current_disruption_risk=42.0,
            risk_category="Moderate",
            temperature_sensitive=True,
            temp_celsius=4.5,
            delay_minutes=0,
            weather_severity_score=0.3,
            road_disruption_level=0.1,
            last_updated=now
        )

        db.add_all([s1, s2, s3, s4, s5, s6])

        # 2. Inventory Items
        inv1 = InventoryItem(
            id="INV-001",
            medicine_name="Insulin Glargine 100U/mL (Lantus)",
            facility_name="St. Jude Memorial Hospital, Emergency Wing",
            current_stock=25,
            safety_stock=50,
            average_hourly_consumption=2.8,
            forecast_demand=65,
            incoming_replenishment_quantity=200,
            expected_replenishment_time=now + datetime.timedelta(hours=2, minutes=45),
            estimated_hours_remaining=8.9,
            is_shortage_predicted=True,
            last_updated=now
        )

        inv2 = InventoryItem(
            id="INV-002",
            medicine_name="Epinephrine 1mg/mL Auto-Injectors",
            facility_name="Children's Emergency Trauma Center",
            current_stock=18,
            safety_stock=40,
            average_hourly_consumption=1.5,
            forecast_demand=40,
            incoming_replenishment_quantity=150,
            expected_replenishment_time=now + datetime.timedelta(hours=2, minutes=20),
            estimated_hours_remaining=12.0,
            is_shortage_predicted=True,
            last_updated=now
        )

        inv3 = InventoryItem(
            id="INV-003",
            medicine_name="Amoxicillin-Clavulanate 1000mg IV",
            facility_name="General Hospital Pulmonology Unit",
            current_stock=90,
            safety_stock=60,
            average_hourly_consumption=4.0,
            forecast_demand=100,
            incoming_replenishment_quantity=500,
            expected_replenishment_time=now + datetime.timedelta(hours=1, minutes=10),
            estimated_hours_remaining=22.5,
            is_shortage_predicted=False,
            last_updated=now
        )

        inv4 = InventoryItem(
            id="INV-004",
            medicine_name="Packed Red Blood Cells (O-Negative)",
            facility_name="University Trauma Hospital",
            current_stock=8,
            safety_stock=20,
            average_hourly_consumption=1.2,
            forecast_demand=25,
            incoming_replenishment_quantity=40,
            expected_replenishment_time=now + datetime.timedelta(minutes=35),
            estimated_hours_remaining=6.7,
            is_shortage_predicted=True,
            last_updated=now
        )

        inv5 = InventoryItem(
            id="INV-005",
            medicine_name="Norepinephrine Bitartrate 4mg/4mL",
            facility_name="St. Jude Memorial Hospital, Emergency Wing",
            current_stock=12,
            safety_stock=30,
            average_hourly_consumption=1.8,
            forecast_demand=45,
            incoming_replenishment_quantity=120,
            expected_replenishment_time=now + datetime.timedelta(hours=3, minutes=15),
            estimated_hours_remaining=6.7,
            is_shortage_predicted=True,
            last_updated=now
        )

        inv6 = InventoryItem(
            id="INV-006",
            medicine_name="Snake Antivenom Polyvalent 10mL",
            facility_name="Rural Community Health Hub",
            current_stock=4,
            safety_stock=10,
            average_hourly_consumption=0.4,
            forecast_demand=12,
            incoming_replenishment_quantity=50,
            expected_replenishment_time=now + datetime.timedelta(hours=1, minutes=15),
            estimated_hours_remaining=10.0,
            is_shortage_predicted=True,
            last_updated=now
        )

        db.add_all([inv1, inv2, inv3, inv4, inv5, inv6])

        # 3. Seed Events
        e1 = Event(
            id="EVT-INIT-101",
            event_type="SHIPMENT_DEPARTED",
            timestamp=now - datetime.timedelta(hours=2),
            source="TELEMETRY",
            shipment_id="SHP-801",
            location_name="Metro Central Depot",
            severity="INFO",
            payload=json.dumps({"origin": "Metro Central Depot", "driver_id": "DRV-442"}),
            processing_status="PROCESSED",
            processed_at=now - datetime.timedelta(hours=2),
            correlation_id="Z-RESCUE-TX-INIT01"
        )
        e2 = Event(
            id="EVT-INIT-102",
            event_type="ROAD_CLOSURE_REPORTED",
            timestamp=now - datetime.timedelta(hours=1, minutes=15),
            source="TRAFFIC_AUTHORITY",
            shipment_id="SHP-805",
            location_name="Kanchipuram Outer Ring Corridor",
            severity="CRITICAL",
            payload=json.dumps({"reason": "Flash flood culvert structural breach", "disruption_level": 0.9}),
            processing_status="PROCESSED",
            processed_at=now - datetime.timedelta(hours=1, minutes=15),
            correlation_id="Z-RESCUE-TX-INIT02"
        )
        e3 = Event(
            id="EVT-INIT-103",
            event_type="HEAVY_RAINFALL_WARNING",
            timestamp=now - datetime.timedelta(hours=1),
            source="WEATHER_SERVICE",
            shipment_id="SHP-802",
            location_name="Ranipet Highway Junction",
            severity="WARNING",
            payload=json.dumps({"rainfall_mm": 48.5, "weather_severity": 0.65}),
            processing_status="PROCESSED",
            processed_at=now - datetime.timedelta(hours=1),
            correlation_id="Z-RESCUE-TX-INIT03"
        )

        db.add_all([e1, e2, e3])

        # 4. Seed Alerts
        a1 = Alert(
            id="ALT-CRIT-805-001",
            severity="CRITICAL",
            alert_type="CRITICAL_DISRUPTION_RISK",
            shipment_id="SHP-805",
            title="Critical Delivery Disruption: Norepinephrine (SHP-805)",
            explanation="AI prediction model projects 84.5% disruption likelihood. Culvert breach on NH-48 caused 135-minute transit halt.",
            evidence=json.dumps({"risk_score": 84.5, "delay_minutes": 135, "road_disruption_level": 0.9}),
            suggested_action="Execute emergency reroute via SH-58 and verify mutual-aid reserve with St. Jude trauma team.",
            status="NEW",
            created_at=now - datetime.timedelta(hours=1)
        )
        a2 = Alert(
            id="ALT-HIGH-802-002",
            severity="HIGH",
            alert_type="WEATHER_WARNING_ROUTE",
            shipment_id="SHP-802",
            title="Severe Weather Interruption: Epinephrine (SHP-802)",
            explanation="Monsoon rainfall alert (48.5 mm) crossing Ranipet junction. Driver delay climbing past 80 minutes.",
            evidence=json.dumps({"weather_severity": 0.65, "rainfall_mm": 48.5}),
            suggested_action="Verify secondary logistics escort and alert destination ICU receiving team.",
            status="NEW",
            created_at=now - datetime.timedelta(minutes=45)
        )
        a3 = Alert(
            id="ALT-INV-001-003",
            severity="HIGH",
            alert_type="INVENTORY_BELOW_SAFETY",
            inventory_id="INV-001",
            title="Critical Stock Deficit: Insulin Glargine at St. Jude Memorial Hospital",
            explanation="Current stock is 25 units, beneath required safety threshold of 50 units. Depletion in 8.9 hours.",
            evidence=json.dumps({"current_stock": 25, "safety_stock": 50, "hours_remaining": 8.9}),
            suggested_action="Ensure incoming shipment SHP-801 arrives before 18:00 or initiate priority transfer.",
            status="NEW",
            created_at=now - datetime.timedelta(minutes=30)
        )

        db.add_all([a1, a2, a3])

        # 5. Seed Recommendations
        r1 = Recommendation(
            id="REC-RTE-805-001",
            shipment_id="SHP-805",
            proposed_action="Reroute Norepinephrine shipment via SH-58 secondary arterial corridor.",
            reason="NH-48 closed due to culvert damage; detour reduces projected delay by 55 minutes.",
            supporting_evidence="Verified traffic clearance telemetry from Regional Highways Department.",
            priority="CRITICAL",
            expected_operational_benefit="Restores delivery window before hospital ICU safety stock runs out.",
            requires_human_approval=True,
            is_approved=False,
            created_at=now - datetime.timedelta(minutes=50)
        )
        r2 = Recommendation(
            id="REC-INV-801-002",
            shipment_id="SHP-801",
            proposed_action="Quarantine 15 units of Lantus buffer at St. Jude Emergency Wing for priority admissions.",
            reason="Safety stock reserve is at 50% capacity; buffer ring-fencing ensures emergency continuity.",
            supporting_evidence="Destination inventory: 25 units vs safety threshold 50 units.",
            priority="HIGH",
            expected_operational_benefit="Prevents non-critical elective dispensing from draining emergency stock.",
            requires_human_approval=True,
            is_approved=False,
            created_at=now - datetime.timedelta(minutes=20)
        )

        db.add_all([r1, r2])

        # 6. Audit Trail
        aud1 = AuditLog(
            id="AUD-SEED-001",
            timestamp=now - datetime.timedelta(hours=2),
            action_type="DATABASE_INITIALIZED",
            entity_type="SYSTEM",
            details="Database populated with validated IBM Z Datathon 2026 seed scenario (6 shipments, 6 inventory lines).",
            model_version="1.0.0-ibmz-rf",
            correlation_id="Z-RESCUE-TX-INIT00",
            user_actor="SYSTEM_INITIALIZER"
        )
        db.add(aud1)

        db.commit()
        print("[Seed] Successfully initialized and seeded Z-Rescue database.")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
