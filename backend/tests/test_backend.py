import unittest
import json
import uuid
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import Shipment, InventoryItem, Event, Alert, Recommendation, AuditLog
from backend.app.ai.risk_engine import RiskEngine
from backend.app.integrations.weather_service import WeatherService
from backend.app.integrations.transaction_processor import LocalDemoTransactionProcessor, IBMZTransactionProcessor
from backend.app.engines.inventory_engine import inventory_engine

from sqlalchemy.pool import StaticPool

# In-memory SQLite with StaticPool so all connections share the same memory database
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestZRescueBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(app)

    def setUp(self):
        # Clean and seed basic state
        Base.metadata.drop_all(bind=test_engine)
        Base.metadata.create_all(bind=test_engine)
        self.db = TestingSessionLocal()
        
        # Seed test shipment
        self.test_shipment = Shipment(
            id="SHP-TEST-001",
            medicine_name="Insulin Glargine 100U/mL",
            medicine_category="Cold-Chain Emergency",
            origin="Bangalore Cold Depot",
            origin_lat=12.9716,
            origin_lng=77.5946,
            destination="Chennai Emergency Trauma Center",
            destination_lat=13.0827,
            destination_lng=80.2707,
            current_location_name="Hosur Toll",
            current_lat=12.7400,
            current_lng=77.8200,
            dispatch_time=datetime.datetime.utcnow(),
            expected_delivery_time=datetime.datetime.utcnow() + datetime.timedelta(hours=4),
            current_estimated_delivery_time=datetime.datetime.utcnow() + datetime.timedelta(hours=4),
            shipment_status="IN_TRANSIT",
            priority="CRITICAL",
            required_quantity=100,
            available_destination_inventory=25,
            safety_stock_threshold=50,
            supplier="AeroMed Lifeline Supplies",
            current_disruption_risk=25.0,
            risk_category="Low",
            temperature_sensitive=True,
            temp_celsius=4.0,
            delay_minutes=0
        )
        self.db.add(self.test_shipment)

        # Seed test inventory item
        self.test_inv = InventoryItem(
            id="INV-TEST-001",
            medicine_name="Insulin Glargine 100U/mL",
            facility_name="Chennai Emergency Trauma Center",
            current_stock=25,
            safety_stock=50,
            average_hourly_consumption=2.5,
            forecast_demand=60,
            incoming_replenishment_quantity=100,
            expected_replenishment_time=datetime.datetime.utcnow() + datetime.timedelta(hours=5),
            estimated_hours_remaining=10.0,
            is_shortage_predicted=True
        )
        self.db.add(self.test_inv)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    # Test 1: Application Health Check
    def test_01_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "UP")
        self.assertEqual(data["event_code"], "SSF2026")
        self.assertEqual(data["team"], "UNI MIND")

    # Test 2: Database Initialization & Tables
    def test_02_database_initialization(self):
        count = self.db.query(Shipment).count()
        self.assertGreaterEqual(count, 1)

    # Test 3: Shipment Creation
    def test_03_shipment_creation(self):
        new_shp = {
            "id": "SHP-NEW-999",
            "medicine_name": "Epinephrine Auto-Injector",
            "medicine_category": "Emergency Resuscitation",
            "origin": "Depot North",
            "origin_lat": 12.95,
            "origin_lng": 77.60,
            "destination": "Hospital Central",
            "destination_lat": 13.05,
            "destination_lng": 80.20,
            "current_location_name": "Checkpost Alpha",
            "current_lat": 12.99,
            "current_lng": 78.10,
            "dispatch_time": datetime.datetime.utcnow().isoformat(),
            "expected_delivery_time": (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).isoformat(),
            "current_estimated_delivery_time": (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).isoformat(),
            "shipment_status": "IN_TRANSIT",
            "priority": "HIGH",
            "required_quantity": 50,
            "available_destination_inventory": 30,
            "safety_stock_threshold": 40,
            "supplier": "Apex Pharma",
            "temperature_sensitive": False,
            "temp_celsius": 20.0,
            "delay_minutes": 0
        }
        res = self.client.post("/api/v1/shipments", json=new_shp)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["id"], "SHP-NEW-999")
        self.assertIn("risk_category", data)

    # Test 4: Shipment Update
    def test_04_shipment_update(self):
        res = self.client.patch("/api/v1/shipments/SHP-TEST-001", json={"delay_minutes": 45, "shipment_status": "DELAYED"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["delay_minutes"], 45)
        self.assertEqual(data["shipment_status"], "DELAYED")

    # Test 5: Event Schema Validation
    def test_05_event_schema_validation(self):
        payload = {
            "event_type": "HEAVY_RAINFALL_WARNING",
            "source": "WEATHER_SERVICE",
            "shipment_id": "SHP-TEST-001",
            "severity": "WARNING",
            "payload": {"rainfall_mm": 52.0}
        }
        res = self.client.post("/api/v1/events", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["event_type"], "HEAVY_RAINFALL_WARNING")
        self.assertEqual(data["processing_status"], "PROCESSED")

    # Test 6: Duplicate Event Rejection
    def test_06_duplicate_event_rejection(self):
        unique_id = f"EVT-DUP-{uuid.uuid4().hex[:6]}"
        payload = {
            "id": unique_id,
            "event_type": "SHIPMENT_DELAYED",
            "source": "TELEMETRY",
            "shipment_id": "SHP-TEST-001",
            "severity": "WARNING",
            "payload": {"delay_minutes": 15}
        }
        # First post succeeds
        res1 = self.client.post("/api/v1/events", json=payload)
        self.assertEqual(res1.status_code, 201)

        # Second post with identical ID is rejected
        res2 = self.client.post("/api/v1/events", json=payload)
        self.assertEqual(res2.status_code, 409)

    # Test 7: Valid Event Persistence
    def test_07_valid_event_persistence(self):
        ev_id = f"EVT-PERSIST-{uuid.uuid4().hex[:6]}"
        payload = {
            "id": ev_id,
            "event_type": "DELIVERY_ETA_CHANGED",
            "source": "DISPATCHER",
            "shipment_id": "SHP-TEST-001",
            "payload": {"delay_minutes": 25}
        }
        self.client.post("/api/v1/events", json=payload)
        res = self.client.get(f"/api/v1/events?shipment_id=SHP-TEST-001")
        self.assertEqual(res.status_code, 200)
        events = res.json()
        self.assertTrue(any(e["id"] == ev_id for e in events))

    # Test 8: Risk Score Bounds from 0 to 100
    def test_08_risk_score_bounds(self):
        engine = RiskEngine()
        # Extreme negative inputs
        low_res = engine.compute_risk(0, 0.0, 0.0, False, 5.0, 0.0, "NORMAL")
        self.assertGreaterEqual(low_res["risk_score"], 0.0)
        self.assertLessEqual(low_res["risk_score"], 100.0)

        # Extreme catastrophic inputs
        high_res = engine.compute_risk(300, 1.0, 150.0, True, 0.05, 12.0, "CRITICAL")
        self.assertGreaterEqual(high_res["risk_score"], 0.0)
        self.assertLessEqual(high_res["risk_score"], 100.0)

    # Test 9: Risk Category Threshold Mapping
    def test_09_risk_category_mapping(self):
        engine = RiskEngine()
        # Low condition
        r1 = engine.compute_risk(0, 0.0, 0.0, False, 2.0, 0.0, "NORMAL")
        self.assertIn(r1["risk_category"], ["Low", "Moderate"])

        # Catastrophic condition
        r2 = engine.compute_risk(120, 0.9, 80.0, True, 0.1, 8.0, "CRITICAL")
        self.assertIn(r2["risk_category"], ["High", "Critical"])

    # Test 10: Rule-based Fallback Behavior
    def test_10_rule_based_fallback(self):
        # Force fallback engine with nonexistent model path
        fallback_engine = RiskEngine(model_path="nonexistent.joblib", meta_path="nonexistent.json")
        self.assertTrue(fallback_engine.is_fallback)
        self.assertIn("fallback", fallback_engine.metadata.get("model_version", "").lower())
        
        res = fallback_engine.compute_risk(60, 0.5, 40.0, True, 0.4, 3.0, "CRITICAL")
        self.assertGreaterEqual(res["risk_score"], 60.0)
        self.assertTrue(res["is_fallback"])

    # Test 11: Model Loading and Prediction API
    def test_11_model_loading_and_prediction_api(self):
        req = {
            "delay_minutes": 45,
            "weather_severity": 0.7,
            "rainfall_mm": 40.0,
            "road_closure_reported": True,
            "inventory_coverage_ratio": 0.3,
            "medicine_criticality": "CRITICAL",
            "temp_deviation": 3.5
        }
        res = self.client.post("/api/v1/risk/predict", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("risk_score", data)
        self.assertIn("contributing_factors", data)
        self.assertGreater(len(data["contributing_factors"]), 0)

    # Test 12: High-Risk Alert Creation
    def test_12_high_risk_alert_creation(self):
        # Post severe event causing high risk
        payload = {
            "event_type": "ROAD_CLOSURE_REPORTED",
            "source": "TRAFFIC_POLICE",
            "shipment_id": "SHP-TEST-001",
            "severity": "CRITICAL",
            "payload": {"disruption_level": 0.9, "reason": "Bridge submerged"}
        }
        self.client.post("/api/v1/events", json=payload)
        
        alerts_res = self.client.get("/api/v1/alerts?shipment_id=SHP-TEST-001")
        self.assertEqual(alerts_res.status_code, 200)
        alerts = alerts_res.json()
        self.assertGreaterEqual(len(alerts), 1)

    # Test 13: Duplicate Alert Suppression
    def test_13_duplicate_alert_suppression(self):
        initial_alerts = len(self.client.get("/api/v1/alerts").json())
        
        # Trigger same alert-inducing event twice
        ev = {
            "event_type": "ROAD_CLOSURE_REPORTED",
            "source": "POLICE",
            "shipment_id": "SHP-TEST-001",
            "severity": "CRITICAL",
            "payload": {"disruption_level": 0.95}
        }
        self.client.post("/api/v1/events", json=ev)
        after_first = len(self.client.get("/api/v1/alerts").json())
        
        # Another event with same type
        ev2 = {
            "event_type": "ROAD_CLOSURE_REPORTED",
            "source": "POLICE",
            "shipment_id": "SHP-TEST-001",
            "severity": "CRITICAL",
            "payload": {"disruption_level": 0.95}
        }
        self.client.post("/api/v1/events", json=ev2)
        after_second = len(self.client.get("/api/v1/alerts").json())
        
        # Should not duplicate active NEW alert
        self.assertEqual(after_first, after_second)

    # Test 14: Alert Acknowledgment
    def test_14_alert_acknowledgment(self):
        alerts = self.client.get("/api/v1/alerts").json()
        if not alerts:
            # Create an alert
            self.test_12_high_risk_alert_creation()
            alerts = self.client.get("/api/v1/alerts").json()

        alert_id = alerts[0]["id"]
        res = self.client.patch(f"/api/v1/alerts/{alert_id}", json={"status": "ACKNOWLEDGED", "user": "Dr. Sarah Rao"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ACKNOWLEDGED")
        self.assertEqual(res.json()["acknowledged_by"], "Dr. Sarah Rao")

    # Test 15: Alert Resolution
    def test_15_alert_resolution(self):
        alerts = self.client.get("/api/v1/alerts").json()
        if not alerts:
            self.test_12_high_risk_alert_creation()
            alerts = self.client.get("/api/v1/alerts").json()

        alert_id = alerts[0]["id"]
        res = self.client.patch(f"/api/v1/alerts/{alert_id}", json={"status": "RESOLVED", "user": "Chief Coordinator Patel"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "RESOLVED")
        self.assertEqual(res.json()["resolved_by"], "Chief Coordinator Patel")

    # Test 16: Inventory Safety-Stock Alert
    def test_16_inventory_safety_stock_alert(self):
        # Drop inventory below safety stock
        self.test_inv.current_stock = 10
        self.test_inv.safety_stock = 50
        self.db.add(self.test_inv)
        self.db.commit()

        inventory_engine.evaluate_inventory_health(self.test_inv, self.db)
        alert = self.db.query(Alert).filter(Alert.inventory_id == self.test_inv.id).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.alert_type, "INVENTORY_BELOW_SAFETY")

    # Test 17: Stock Coverage Calculation
    def test_17_stock_coverage_calculation(self):
        self.test_inv.current_stock = 30
        self.test_inv.average_hourly_consumption = 3.0
        health = inventory_engine.evaluate_inventory_health(self.test_inv, self.db)
        self.assertEqual(health["hours_remaining"], 10.0)

    # Test 18: Malformed Request Handling
    def test_18_malformed_request_handling(self):
        # Send invalid body missing required event_type
        res = self.client.post("/api/v1/events", json={"invalid_field": 123})
        self.assertEqual(res.status_code, 422)

    # Test 19: Missing Shipment Handling
    def test_19_missing_shipment_handling(self):
        res = self.client.get("/api/v1/shipments/SHP-NON-EXISTENT-404")
        self.assertEqual(res.status_code, 404)

    # Test 20: Transaction Processor Result Structure
    def test_20_transaction_processor(self):
        proc = LocalDemoTransactionProcessor()
        res = proc.process_event_transaction({"id": "EVT-TX-001", "event_type": "TEST_TX"})
        self.assertTrue(res.success)
        self.assertTrue(res.correlation_id.startswith("Z-RESCUE-TX"))
        self.assertGreater(res.latency_ms, 0.0)
        self.assertIn("Local Demo Processor", res.processor_name)

    # Test 21: Demo Event Generator Start and Stop
    def test_21_demo_generator_controls(self):
        start_res = self.client.post("/api/v1/demo/start")
        self.assertIn(start_res.status_code, [200])
        status_res = self.client.get("/api/v1/demo/status")
        self.assertTrue(status_res.json()["is_running"])

        stop_res = self.client.post("/api/v1/demo/stop")
        self.assertIn(stop_res.status_code, [200])
        status_res2 = self.client.get("/api/v1/demo/status")
        self.assertFalse(status_res2.json()["is_running"])

    # Test 22: Dashboard Metrics Changing After Events
    def test_22_dashboard_metrics_updating(self):
        d1 = self.client.get("/api/v1/dashboard/summary").json()
        
        # Post event escalating delay
        ev = {
            "event_type": "SHIPMENT_DELAYED",
            "source": "TELEMETRY",
            "shipment_id": "SHP-TEST-001",
            "severity": "HIGH",
            "payload": {"delay_minutes": 75}
        }
        self.client.post("/api/v1/events", json=ev)
        d2 = self.client.get("/api/v1/dashboard/summary").json()
        self.assertGreaterEqual(d2["total_active_shipments"], 1)

    # Test 23: External API Failure & Stale Data Fallback
    def test_23_weather_service_fallback(self):
        svc = WeatherService()
        # Force timeout / offline lookup
        svc.timeout = 0.0001
        res = svc.get_weather(12.9716, 77.5946, "Remote Waypoint")
        self.assertIn("data_source", res)
        self.assertIn("temperature_celsius", res)

    # Test 24: Audit Event Creation
    def test_24_audit_event_creation(self):
        res = self.client.get("/api/v1/audit")
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertIsInstance(logs, list)

    # Test 25: Demo Scenario End-to-End Steps
    def test_25_demo_scenario_step_execution(self):
        # Step 1
        s1 = self.client.post("/api/v1/demo/scenario/step/1")
        # Step may return 200 or 404 if test db doesn't have SHP-801;
        # let's insert SHP-801 into test db and test
        shp801 = Shipment(
            id="SHP-801",
            medicine_name="Insulin Glargine 100U/mL (Lantus)",
            medicine_category="Cold-Chain Emergency",
            origin="Metro Central Depot",
            origin_lat=12.9716,
            origin_lng=77.5946,
            destination="St. Jude Memorial Hospital",
            destination_lat=13.0827,
            destination_lng=80.2707,
            current_location_name="Vellore Checkpoint",
            current_lat=12.92,
            current_lng=79.13,
            dispatch_time=datetime.datetime.utcnow(),
            expected_delivery_time=datetime.datetime.utcnow() + datetime.timedelta(hours=3),
            current_estimated_delivery_time=datetime.datetime.utcnow() + datetime.timedelta(hours=3),
            shipment_status="IN_TRANSIT",
            priority="CRITICAL",
            required_quantity=200,
            available_destination_inventory=25,
            safety_stock_threshold=50,
            supplier="AeroMed Lifeline Supplies",
            current_disruption_risk=28.0,
            risk_category="Low",
            delay_minutes=15
        )
        self.db.add(shp801)
        self.db.commit()

        res1 = self.client.post("/api/v1/demo/scenario/step/1")
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["step"], 1)

        res2 = self.client.post("/api/v1/demo/scenario/step/2")
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["step"], 2)

        res3 = self.client.post("/api/v1/demo/scenario/step/3")
        self.assertEqual(res3.status_code, 200)
        self.assertEqual(res3.json()["step"], 3)

if __name__ == "__main__":
    unittest.main()
