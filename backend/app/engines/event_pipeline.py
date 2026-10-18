import json
import uuid
import datetime
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from backend.app.models import Event, Shipment, InventoryItem, AuditLog
from backend.app.schemas import EventCreate
from backend.app.ai.risk_engine import risk_engine
from backend.app.engines.alert_engine import alert_engine
from backend.app.engines.recommendation_engine import recommendation_engine
from backend.app.engines.inventory_engine import inventory_engine
from backend.app.integrations.transaction_processor import get_transaction_processor
from backend.app.websocket_manager import ws_manager

class EventPipeline:
    @staticmethod
    async def process_incoming_event(event_in: EventCreate, db: Session) -> Tuple[Event, bool, str]:
        """
        Processes an incoming event transaction:
        1. Checks for duplicate event_id
        2. Validates and assigns UUID/timestamp if missing
        3. Invokes active TransactionProcessor (IBM Z or Local Demo)
        4. Updates affected Shipment / Inventory state
        5. Recomputes AI risk score & explainable factors
        6. Generates alerts and recommendations
        7. Commits to database and logs audit entry
        8. Broadcasts live event over WebSocket
        """
        event_id = event_in.id or f"EVT-{uuid.uuid4().hex[:10].upper()}"
        
        # 1. Duplicate check
        existing = db.query(Event).filter(Event.id == event_id).first()
        if existing:
            # Audit rejection
            audit = AuditLog(
                id=f"AUD-REJ-{uuid.uuid4().hex[:8]}",
                action_type="EVENT_REJECTED",
                entity_type="EVENT",
                entity_id=event_id,
                details=f"Duplicate event rejected: {event_in.event_type} from {event_in.source}",
                user_actor="EVENT_PIPELINE"
            )
            db.add(audit)
            db.commit()
            return existing, False, "Duplicate event ID rejected."

        # 2. Transaction processor execution
        processor = get_transaction_processor()
        tx_data = {
            "id": event_id,
            "event_type": event_in.event_type,
            "source": event_in.source,
            "shipment_id": event_in.shipment_id,
            "payload": event_in.payload
        }
        tx_result = processor.process_event_transaction(tx_data)

        # 3. Create Event record
        event_record = Event(
            id=event_id,
            event_type=event_in.event_type,
            timestamp=event_in.timestamp or datetime.datetime.utcnow(),
            source=event_in.source,
            shipment_id=event_in.shipment_id,
            location_name=event_in.location_name,
            severity=event_in.severity,
            payload=json.dumps(event_in.payload),
            processing_status="PROCESSED" if tx_result.success else "FAILED",
            processed_at=datetime.datetime.utcnow(),
            correlation_id=tx_result.correlation_id
        )
        db.add(event_record)

        # 4. State updates based on event type
        shipment = None
        if event_in.shipment_id:
            shipment = db.query(Shipment).filter(Shipment.id == event_in.shipment_id).first()

        payload = event_in.payload

        if shipment:
            if event_in.event_type == "SHIPMENT_DELAYED":
                add_delay = int(payload.get("delay_minutes", 20))
                shipment.delay_minutes += add_delay
                shipment.current_estimated_delivery_time += datetime.timedelta(minutes=add_delay)
                shipment.shipment_status = "DELAYED"

            elif event_in.event_type == "ROAD_CLOSURE_REPORTED" or event_in.event_type == "USER_ROAD_REPORT":
                shipment.road_disruption_level = float(payload.get("disruption_level", 0.85))
                shipment.shipment_status = "DELAYED"
                if "location_name" in payload:
                    shipment.current_location_name = payload["location_name"]

            elif event_in.event_type in ("HEAVY_RAINFALL_WARNING", "WEATHER_DETERIORATED"):
                shipment.weather_severity_score = float(payload.get("weather_severity", 0.75))

            elif event_in.event_type == "INVENTORY_DECREASED":
                new_inventory = int(payload.get("available_destination_inventory", max(0, shipment.available_destination_inventory - 15)))
                shipment.available_destination_inventory = new_inventory

            elif event_in.event_type == "DELIVERY_ETA_CHANGED":
                if "delay_minutes" in payload:
                    shipment.delay_minutes = int(payload["delay_minutes"])
                if "current_location_name" in payload:
                    shipment.current_location_name = payload["current_location_name"]

            elif event_in.event_type == "SHIPMENT_DELIVERED":
                shipment.shipment_status = "DELIVERED"
                shipment.current_disruption_risk = 0.0
                shipment.risk_category = "Low"

            elif event_in.event_type == "SHIPMENT_CANCELLED":
                shipment.shipment_status = "CANCELLED"

            if "temp_celsius" in payload:
                shipment.temp_celsius = float(payload["temp_celsius"])

            # 5. Recompute AI Risk Score
            coverage_ratio = shipment.available_destination_inventory / max(shipment.safety_stock_threshold, 1)
            temp_dev = abs(shipment.temp_celsius - 4.0) if shipment.temperature_sensitive else 0.0

            risk_eval = risk_engine.compute_risk(
                delay_minutes=shipment.delay_minutes,
                weather_severity=shipment.weather_severity_score,
                rainfall_mm=float(payload.get("rainfall_mm", 0.0)),
                road_closure_reported=(shipment.road_disruption_level >= 0.6),
                inventory_coverage_ratio=coverage_ratio,
                temp_deviation_celsius=temp_dev,
                medicine_criticality=shipment.priority
            )

            shipment.current_disruption_risk = risk_eval["risk_score"]
            shipment.risk_category = risk_eval["risk_category"]
            shipment.last_updated = datetime.datetime.utcnow()
            db.add(shipment)

            # 6. Evaluate Alerts & Recommendations
            alert_engine.evaluate_shipment_alerts(shipment, db)
            recommendation_engine.generate_recommendations(shipment, db)

        # 7. Inventory check if event targets an inventory item
        if event_in.event_type in ("INVENTORY_DECREASED", "MEDICINE_DEMAND_INCREASED"):
            facility = payload.get("facility_name")
            medicine = payload.get("medicine_name")
            if facility and medicine:
                inv_item = db.query(InventoryItem).filter(
                    InventoryItem.facility_name == facility,
                    InventoryItem.medicine_name == medicine
                ).first()
                if inv_item:
                    if event_in.event_type == "INVENTORY_DECREASED":
                        inv_item.current_stock = max(0, inv_item.current_stock - int(payload.get("amount", 10)))
                    elif event_in.event_type == "MEDICINE_DEMAND_INCREASED":
                        inv_item.average_hourly_consumption = float(payload.get("new_consumption_rate", inv_item.average_hourly_consumption * 1.5))
                    inventory_engine.evaluate_inventory_health(inv_item, db)

        # 8. Audit log entry
        audit_record = AuditLog(
            id=f"AUD-{uuid.uuid4().hex[:10].upper()}",
            action_type="EVENT_RECEIVED",
            entity_type="EVENT",
            entity_id=event_id,
            details=f"Processed {event_in.event_type} from {event_in.source} (Latency: {tx_result.latency_ms:.1f}ms)",
            model_version=risk_engine.metadata.get("model_version"),
            correlation_id=tx_result.correlation_id,
            user_actor="PIPELINE_CONTROLLER"
        )
        db.add(audit_record)

        db.commit()
        db.refresh(event_record)

        # 9. Real-time WebSocket Broadcast
        await ws_manager.broadcast({
            "type": "NEW_EVENT",
            "event": {
                "id": event_record.id,
                "event_type": event_record.event_type,
                "timestamp": event_record.timestamp.isoformat(),
                "source": event_record.source,
                "shipment_id": event_record.shipment_id,
                "severity": event_record.severity,
                "processing_status": event_record.processing_status,
                "correlation_id": event_record.correlation_id
            },
            "shipment_update": {
                "id": shipment.id,
                "risk_score": shipment.current_disruption_risk,
                "risk_category": shipment.risk_category,
                "delay_minutes": shipment.delay_minutes,
                "status": shipment.shipment_status
            } if shipment else None
        })

        return event_record, True, "Event successfully ingested and processed."

event_pipeline = EventPipeline()
