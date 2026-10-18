from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Alert
from backend.app.schemas import AlertResponse, AlertUpdate
from backend.app.engines.alert_engine import alert_engine

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status (NEW, ACKNOWLEDGED, RESOLVED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (INFO, WARNING, HIGH, CRITICAL)"),
    shipment_id: Optional[str] = Query(None, description="Filter by shipment ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if shipment_id:
        query = query.filter(Alert.shipment_id == shipment_id)
    return query.order_by(Alert.created_at.desc()).all()

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert_status(alert_id: str, update_in: AlertUpdate, db: Session = Depends(get_db)):
    status_upper = update_in.status.upper()
    if status_upper == "ACKNOWLEDGED":
        alert = alert_engine.acknowledge_alert(alert_id, update_in.user, db)
    elif status_upper == "RESOLVED":
        alert = alert_engine.resolve_alert(alert_id, update_in.user, db)
    else:
        raise HTTPException(status_code=400, detail="Status must be ACKNOWLEDGED or RESOLVED")

    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")
    return alert
