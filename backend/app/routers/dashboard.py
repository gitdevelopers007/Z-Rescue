import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models import Shipment, Alert, InventoryItem, Event, Recommendation
from backend.app.schemas import DashboardSummary
from backend.app.config import settings

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_active = db.query(Shipment).filter(Shipment.shipment_status.in_(["IN_TRANSIT", "DELAYED", "DISPATCHED"])).count()
    high_risk = db.query(Shipment).filter(
        Shipment.risk_category == "High",
        Shipment.shipment_status.in_(["IN_TRANSIT", "DELAYED", "DISPATCHED"])
    ).count()
    critical_risk = db.query(Shipment).filter(
        Shipment.risk_category == "Critical",
        Shipment.shipment_status.in_(["IN_TRANSIT", "DELAYED", "DISPATCHED"])
    ).count()

    critical_stock_alerts = db.query(InventoryItem).filter(InventoryItem.is_shortage_predicted == True).count()

    avg_risk = db.query(func.avg(Shipment.current_disruption_risk)).filter(
        Shipment.shipment_status.in_(["IN_TRANSIT", "DELAYED", "DISPATCHED"])
    ).scalar() or 0.0

    active_alerts = db.query(Alert).filter(Alert.status.in_(["NEW", "ACKNOWLEDGED"])).count()

    interventions = db.query(Shipment).filter(
        Shipment.current_disruption_risk >= 60.0,
        Shipment.shipment_status.in_(["IN_TRANSIT", "DELAYED", "DISPATCHED"])
    ).count()

    # Distributions
    risk_dist = {
        "Low": db.query(Shipment).filter(Shipment.risk_category == "Low").count(),
        "Moderate": db.query(Shipment).filter(Shipment.risk_category == "Moderate").count(),
        "High": db.query(Shipment).filter(Shipment.risk_category == "High").count(),
        "Critical": db.query(Shipment).filter(Shipment.risk_category == "Critical").count(),
    }

    status_dist = {
        "IN_TRANSIT": db.query(Shipment).filter(Shipment.shipment_status == "IN_TRANSIT").count(),
        "DELAYED": db.query(Shipment).filter(Shipment.shipment_status == "DELAYED").count(),
        "DISPATCHED": db.query(Shipment).filter(Shipment.shipment_status == "DISPATCHED").count(),
        "DELIVERED": db.query(Shipment).filter(Shipment.shipment_status == "DELIVERED").count(),
        "CANCELLED": db.query(Shipment).filter(Shipment.shipment_status == "CANCELLED").count(),
    }

    return DashboardSummary(
        total_active_shipments=total_active,
        high_risk_shipments=high_risk,
        critical_risk_shipments=critical_risk,
        critical_medicine_stock_alerts=critical_stock_alerts,
        average_predicted_disruption_risk=round(float(avg_risk), 1),
        active_alerts_count=active_alerts,
        deliveries_requiring_intervention=interventions,
        system_mode=settings.SYSTEM_MODE,
        is_demo_mode=settings.IS_DEMO_MODE,
        processor_name=settings.PROCESSOR_NAME,
        last_refresh_timestamp=datetime.datetime.utcnow(),
        risk_distribution=risk_dist,
        shipment_status_distribution=status_dist
    )
