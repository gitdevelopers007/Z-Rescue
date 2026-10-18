import asyncio
import random
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.database import get_db, SessionLocal
from backend.app.models import Shipment, InventoryItem, Event
from backend.app.schemas import EventCreate
from backend.app.engines.event_pipeline import event_pipeline
from backend.app.seed_data import seed_database
from backend.app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1/demo", tags=["Demo Controls & Scenario"])

class DemoGeneratorState:
    def __init__(self):
        self.is_running: bool = False
        self.interval_seconds: int = 5
        self.task: asyncio.Task = None
        self.generated_count: int = 0
        self.max_events: int = 100

demo_state = DemoGeneratorState()

async def generator_loop():
    print("[DemoGenerator] Generator started.")
    types = [
        "WEATHER_DETERIORATED",
        "SHIPMENT_DELAYED",
        "INVENTORY_DECREASED",
        "DELIVERY_ETA_CHANGED",
        "HEAVY_RAINFALL_WARNING"
    ]
    
    while demo_state.is_running and demo_state.generated_count < demo_state.max_events:
        try:
            await asyncio.sleep(demo_state.interval_seconds)
            if not demo_state.is_running:
                break
                
            db = SessionLocal()
            try:
                # Pick an active shipment
                active_shipments = db.query(Shipment).filter(Shipment.shipment_status.in_(["IN_TRANSIT", "DELAYED"])).all()
                if not active_shipments:
                    continue
                
                target_shp = random.choice(active_shipments)
                ev_type = random.choice(types)
                
                payload = {}
                severity = "INFO"
                if ev_type == "SHIPMENT_DELAYED":
                    extra_delay = random.choice([5, 10, 15])
                    payload = {"delay_minutes": extra_delay, "reason": "Simulated congested bottleneck"}
                    severity = "WARNING"
                elif ev_type in ("WEATHER_DETERIORATED", "HEAVY_RAINFALL_WARNING"):
                    sev_score = round(random.uniform(0.3, 0.75), 2)
                    rain = round(random.uniform(10.0, 45.0), 1)
                    payload = {"weather_severity": sev_score, "rainfall_mm": rain}
                    severity = "WARNING" if sev_score < 0.6 else "HIGH"
                elif ev_type == "INVENTORY_DECREASED":
                    payload = {"available_destination_inventory": max(5, target_shp.available_destination_inventory - 3)}
                    severity = "WARNING"
                else:
                    payload = {"status": "En route via monitored checkpoint"}
                
                ev_in = EventCreate(
                    id=f"EVT-SIM-{uuid.uuid4().hex[:8].upper()}",
                    event_type=ev_type,
                    source="SIMULATOR",
                    shipment_id=target_shp.id,
                    location_name=target_shp.current_location_name,
                    severity=severity,
                    payload=payload
                )
                
                await event_pipeline.process_incoming_event(ev_in, db)
                demo_state.generated_count += 1
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[DemoGenerator] Error: {e}")
            await asyncio.sleep(2)
            
    if demo_state.generated_count >= demo_state.max_events:
        demo_state.is_running = False
    print("[DemoGenerator] Generator loop exited.")

@router.post("/start")
async def start_demo_generator():
    if demo_state.is_running:
        return {"status": "ALREADY_RUNNING", "generated_count": demo_state.generated_count}
    demo_state.is_running = True
    demo_state.task = asyncio.create_task(generator_loop())
    return {
        "status": "STARTED",
        "interval_seconds": demo_state.interval_seconds,
        "max_events": demo_state.max_events,
        "mode": "Simulated Event Generator"
    }

@router.post("/stop")
async def stop_demo_generator():
    demo_state.is_running = False
    if demo_state.task:
        demo_state.task.cancel()
    return {"status": "STOPPED", "generated_count": demo_state.generated_count}

@router.get("/status")
def get_generator_status():
    return {
        "is_running": demo_state.is_running,
        "interval_seconds": demo_state.interval_seconds,
        "generated_count": demo_state.generated_count,
        "max_events": demo_state.max_events
    }

@router.post("/scenario/step/{step_number}")
async def trigger_scenario_step(step_number: int, db: Session = Depends(get_db)):
    """
    Executes an individual step of the official Insulin Demonstration Scenario (SHP-801).
    """
    shp = db.query(Shipment).filter(Shipment.id == "SHP-801").first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment SHP-801 not found. Please reset database.")

    if step_number == 1:
        # Step 1: Heavy rainfall warning reported near route
        ev = EventCreate(
            id=f"EVT-DEMO-S1-{uuid.uuid4().hex[:6].upper()}",
            event_type="HEAVY_RAINFALL_WARNING",
            source="WEATHER_SERVICE",
            shipment_id=shp.id,
            location_name="Vellore Transit Corridor Checkpoint 3",
            severity="WARNING",
            payload={
                "rainfall_mm": 55.0,
                "weather_severity": 0.72,
                "warning": "Monsoon squall warning along NH-48 arterial route"
            }
        )
        record, _, _ = await event_pipeline.process_incoming_event(ev, db)
        return {
            "step": 1,
            "title": "Adverse Weather Alert Ingested",
            "description": "55 mm torrential rainfall reported near Vellore corridor.",
            "updated_risk": shp.current_disruption_risk,
            "risk_category": shp.risk_category
        }

    elif step_number == 2:
        # Step 2: Shipment delay increases significantly
        ev = EventCreate(
            id=f"EVT-DEMO-S2-{uuid.uuid4().hex[:6].upper()}",
            event_type="SHIPMENT_DELAYED",
            source="TELEMETRY",
            shipment_id=shp.id,
            location_name="Vellore Outer Bypass Culvert",
            severity="HIGH",
            payload={
                "delay_minutes": 50,
                "reason": "Hydroplaning hazard and road obstruction forcing single-lane crawling traffic"
            }
        )
        record, _, _ = await event_pipeline.process_incoming_event(ev, db)
        return {
            "step": 2,
            "title": "Transit Delay Escalation",
            "description": "Accumulated transit delay increased to 65 minutes.",
            "updated_risk": shp.current_disruption_risk,
            "risk_category": shp.risk_category
        }

    elif step_number == 3:
        # Step 3: Destination hospital stock coverage drops below threshold
        ev = EventCreate(
            id=f"EVT-DEMO-S3-{uuid.uuid4().hex[:6].upper()}",
            event_type="INVENTORY_DECREASED",
            source="INVENTORY_SYSTEM",
            shipment_id=shp.id,
            location_name="St. Jude Memorial Hospital, Emergency Wing",
            severity="CRITICAL",
            payload={
                "facility_name": "St. Jude Memorial Hospital, Emergency Wing",
                "medicine_name": "Insulin Glargine 100U/mL (Lantus)",
                "available_destination_inventory": 10,
                "amount": 15,
                "reason": "Emergency diabetic ketoacidosis patient intake surge"
            }
        )
        record, _, _ = await event_pipeline.process_incoming_event(ev, db)
        return {
            "step": 3,
            "title": "Destination Inventory Critical Reserve Deficit",
            "description": "On-hand Lantus stock dropped to 10 units (below safety threshold 50). Risk escalated to Critical.",
            "updated_risk": shp.current_disruption_risk,
            "risk_category": shp.risk_category
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid step number. Choose 1, 2, or 3.")

@router.post("/scenario/run")
async def run_full_scenario(db: Session = Depends(get_db)):
    """Runs all 3 steps of the demo scenario sequentially with brief pauses."""
    results = []
    for step in [1, 2, 3]:
        res = await trigger_scenario_step(step, db)
        results.append(res)
        await asyncio.sleep(0.5)
    return {
        "status": "COMPLETED",
        "scenario": "Insulin Supply Chain Crisis Escalation",
        "target_shipment": "SHP-801",
        "steps_executed": results
    }

@router.post("/reset")
def reset_demo_database():
    demo_state.is_running = False
    if demo_state.task:
        demo_state.task.cancel()
    seed_database()
    return {"status": "SUCCESS", "message": "Database reset to verified baseline seed state."}
