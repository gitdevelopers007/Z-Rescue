from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Event
from backend.app.schemas import EventCreate, EventResponse
from backend.app.engines.event_pipeline import event_pipeline

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

@router.get("", response_model=List[EventResponse])
def list_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity (INFO, WARNING, HIGH, CRITICAL)"),
    shipment_id: Optional[str] = Query(None, description="Filter by associated shipment ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if severity:
        query = query.filter(Event.severity == severity.upper())
    if shipment_id:
        query = query.filter(Event.shipment_id == shipment_id)
    return query.order_by(Event.timestamp.desc()).limit(limit).all()

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def submit_event(event_in: EventCreate, db: Session = Depends(get_db)):
    event_record, is_new, msg = await event_pipeline.process_incoming_event(event_in, db)
    if not is_new:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Event rejection: {msg}"
        )
    return event_record
