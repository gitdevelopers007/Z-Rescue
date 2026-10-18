import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Shipment, Event, AuditLog
from backend.app.schemas import ShipmentCreate, ShipmentUpdate, ShipmentResponse, EventResponse
from backend.app.ai.risk_engine import risk_engine

router = APIRouter(prefix="/api/v1/shipments", tags=["Shipments"])

@router.get("", response_model=List[ShipmentResponse])
def list_shipments(
    status: Optional[str] = Query(None, description="Filter by status, e.g. IN_TRANSIT, DELAYED"),
    risk_category: Optional[str] = Query(None, description="Filter by Low, Moderate, High, Critical"),
    medicine: Optional[str] = Query(None, description="Search by medicine name substring"),
    destination: Optional[str] = Query(None, description="Search by destination substring"),
    search: Optional[str] = Query(None, description="General search term across ID, medicine, origin, destination"),
    db: Session = Depends(get_db)
):
    query = db.query(Shipment)
    if status:
        query = query.filter(Shipment.shipment_status == status.upper())
    if risk_category:
        query = query.filter(Shipment.risk_category == risk_category.capitalize())
    if medicine:
        query = query.filter(Shipment.medicine_name.ilike(f"%{medicine}%"))
    if destination:
        query = query.filter(Shipment.destination.ilike(f"%{destination}%"))
    if search:
        term = f"%{search}%"
        query = query.filter(
            (Shipment.id.ilike(term)) |
            (Shipment.medicine_name.ilike(term)) |
            (Shipment.origin.ilike(term)) |
            (Shipment.destination.ilike(term)) |
            (Shipment.supplier.ilike(term))
        )
    return query.order_by(Shipment.current_disruption_risk.desc()).all()

@router.post("", response_model=ShipmentResponse, status_code=201)
def create_shipment(shipment_in: ShipmentCreate, db: Session = Depends(get_db)):
    shipment_id = shipment_in.id or f"SHP-{uuid.uuid4().hex[:6].upper()}"
    existing = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Shipment with ID {shipment_id} already exists.")

    coverage = shipment_in.available_destination_inventory / max(shipment_in.safety_stock_threshold, 1)
    temp_dev = abs(shipment_in.temp_celsius - 4.0) if shipment_in.temperature_sensitive else 0.0

    risk_eval = risk_engine.compute_risk(
        delay_minutes=shipment_in.delay_minutes,
        weather_severity=0.0,
        rainfall_mm=0.0,
        road_closure_reported=False,
        inventory_coverage_ratio=coverage,
        temp_deviation_celsius=temp_dev,
        medicine_criticality=shipment_in.priority
    )

    shipment = Shipment(
        id=shipment_id,
        medicine_name=shipment_in.medicine_name,
        medicine_category=shipment_in.medicine_category,
        origin=shipment_in.origin,
        origin_lat=shipment_in.origin_lat,
        origin_lng=shipment_in.origin_lng,
        destination=shipment_in.destination,
        destination_lat=shipment_in.destination_lat,
        destination_lng=shipment_in.destination_lng,
        current_location_name=shipment_in.current_location_name,
        current_lat=shipment_in.current_lat,
        current_lng=shipment_in.current_lng,
        dispatch_time=shipment_in.dispatch_time,
        expected_delivery_time=shipment_in.expected_delivery_time,
        current_estimated_delivery_time=shipment_in.current_estimated_delivery_time,
        shipment_status=shipment_in.shipment_status,
        priority=shipment_in.priority,
        required_quantity=shipment_in.required_quantity,
        available_destination_inventory=shipment_in.available_destination_inventory,
        safety_stock_threshold=shipment_in.safety_stock_threshold,
        supplier=shipment_in.supplier,
        current_disruption_risk=risk_eval["risk_score"],
        risk_category=risk_eval["risk_category"],
        temperature_sensitive=shipment_in.temperature_sensitive,
        temp_celsius=shipment_in.temp_celsius,
        delay_minutes=shipment_in.delay_minutes,
        weather_severity_score=0.0,
        road_disruption_level=0.0,
        last_updated=datetime.datetime.utcnow()
    )
    db.add(shipment)

    audit = AuditLog(
        id=f"AUD-SHP-{uuid.uuid4().hex[:8]}",
        action_type="SHIPMENT_CREATED",
        entity_type="SHIPMENT",
        entity_id=shipment.id,
        details=f"Created shipment {shipment.id} for {shipment.medicine_name}",
        user_actor="COORDINATOR"
    )
    db.add(audit)
    db.commit()
    db.refresh(shipment)
    return shipment

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(shipment_id: str, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found.")
    return shipment

@router.patch("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(shipment_id: str, update_in: ShipmentUpdate, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found.")

    update_dict = update_in.dict(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(shipment, field, val)

    # Recompute risk
    coverage = shipment.available_destination_inventory / max(shipment.safety_stock_threshold, 1)
    temp_dev = abs(shipment.temp_celsius - 4.0) if shipment.temperature_sensitive else 0.0

    risk_eval = risk_engine.compute_risk(
        delay_minutes=shipment.delay_minutes,
        weather_severity=shipment.weather_severity_score,
        rainfall_mm=0.0,
        road_closure_reported=(shipment.road_disruption_level >= 0.6),
        inventory_coverage_ratio=coverage,
        temp_deviation_celsius=temp_dev,
        medicine_criticality=shipment.priority
    )

    shipment.current_disruption_risk = risk_eval["risk_score"]
    shipment.risk_category = risk_eval["risk_category"]
    shipment.last_updated = datetime.datetime.utcnow()

    db.commit()
    db.refresh(shipment)
    return shipment

@router.get("/{shipment_id}/timeline", response_model=List[EventResponse])
def get_shipment_timeline(shipment_id: str, db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.shipment_id == shipment_id).order_by(Event.timestamp.desc()).all()
    return events
