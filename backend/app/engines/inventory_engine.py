import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models import InventoryItem, Alert, AuditLog

class InventoryEngine:
    @staticmethod
    def evaluate_inventory_health(item: InventoryItem, db: Session) -> Dict[str, Any]:
        """
        Calculates remaining stock coverage, depletion projection,
        and generates proactive shortage warnings.
        """
        consumption = max(item.average_hourly_consumption, 0.1)
        hours_remaining = round(item.current_stock / consumption, 1)
        days_remaining = round(hours_remaining / 24.0, 1)
        
        # Calculate coverage ratio against safety stock
        safety_ratio = round(item.current_stock / max(item.safety_stock, 1), 2)
        
        # Check projected depletion vs replenishment ETA
        shortage_projected = False
        hours_until_replenishment = 999.0
        if item.expected_replenishment_time:
            now = datetime.datetime.utcnow()
            diff_seconds = (item.expected_replenishment_time - now).total_seconds()
            hours_until_replenishment = max(0.0, diff_seconds / 3600.0)
            if hours_until_replenishment > hours_remaining:
                shortage_projected = True

        if item.current_stock < item.safety_stock:
            shortage_projected = True

        # Update item fields
        item.estimated_hours_remaining = hours_remaining
        item.is_shortage_predicted = shortage_projected
        item.last_updated = datetime.datetime.utcnow()
        db.add(item)
        db.commit()

        # Check for alert creation
        if item.current_stock < item.safety_stock:
            InventoryEngine._ensure_safety_stock_alert(item, db, safety_ratio, hours_remaining)
        elif shortage_projected:
            InventoryEngine._ensure_depletion_alert(item, db, hours_remaining, hours_until_replenishment)

        return {
            "item_id": item.id,
            "medicine_name": item.medicine_name,
            "facility_name": item.facility_name,
            "current_stock": item.current_stock,
            "safety_stock": item.safety_stock,
            "hours_remaining": hours_remaining,
            "days_remaining": days_remaining,
            "safety_coverage_ratio": safety_ratio,
            "is_shortage_predicted": shortage_projected
        }

    @staticmethod
    def _ensure_safety_stock_alert(item: InventoryItem, db: Session, safety_ratio: float, hours_left: float):
        existing = db.query(Alert).filter(
            Alert.inventory_id == item.id,
            Alert.alert_type == "INVENTORY_BELOW_SAFETY",
            Alert.status == "NEW"
        ).first()

        if not existing:
            alert = Alert(
                id=f"ALT-INV-{item.id}-{int(datetime.datetime.utcnow().timestamp()) % 10000}",
                severity="HIGH" if safety_ratio > 0.4 else "CRITICAL",
                alert_type="INVENTORY_BELOW_SAFETY",
                inventory_id=item.id,
                title=f"Critical Stock Deficit: {item.medicine_name} at {item.facility_name}",
                explanation=(
                    f"Current on-hand inventory ({item.current_stock} units) has fallen below "
                    f"the mandatory safety stock reserve threshold ({item.safety_stock} units). "
                    f"Projected buffer exhaustion in {hours_left} hours under standard consumption."
                ),
                evidence=(
                    f'{{"current_stock": {item.current_stock}, "safety_stock": {item.safety_stock}, '
                    f'"coverage_ratio": {safety_ratio}, "hours_remaining": {hours_left}}}'
                ),
                suggested_action=(
                    "Authorize emergency inventory redistribution from neighboring regional depot "
                    "or prioritize incoming inbound replenishment shipment."
                ),
                status="NEW",
                created_at=datetime.datetime.utcnow()
            )
            db.add(alert)
            
            audit = AuditLog(
                id=f"AUD-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000}",
                action_type="ALERT_CREATED",
                entity_type="INVENTORY",
                entity_id=item.id,
                details=f"Raised {alert.severity} alert for {item.medicine_name} below safety threshold",
                user_actor="INVENTORY_SAFETY_ENGINE"
            )
            db.add(audit)
            db.commit()

    @staticmethod
    def _ensure_depletion_alert(item: InventoryItem, db: Session, hours_left: float, hours_to_replenish: float):
        existing = db.query(Alert).filter(
            Alert.inventory_id == item.id,
            Alert.alert_type == "PROJECTED_STOCK_DEPLETION",
            Alert.status == "NEW"
        ).first()

        if not existing:
            alert = Alert(
                id=f"ALT-DEP-{item.id}-{int(datetime.datetime.utcnow().timestamp()) % 10000}",
                severity="CRITICAL",
                alert_type="PROJECTED_STOCK_DEPLETION",
                inventory_id=item.id,
                title=f"Projected Supply Gap: {item.medicine_name} at {item.facility_name}",
                explanation=(
                    f"Estimated stock exhaustion ({hours_left} hrs) precedes incoming replenishment delivery ETA "
                    f"({round(hours_to_replenish, 1)} hrs), projecting a stockout gap."
                ),
                evidence=(
                    f'{{"hours_remaining": {hours_left}, "hours_until_replenishment": {round(hours_to_replenish, 1)}}}'
                ),
                suggested_action="Expedite in-transit courier or verify emergency mutual-aid hospital borrow protocol.",
                status="NEW",
                created_at=datetime.datetime.utcnow()
            )
            db.add(alert)
            db.commit()

inventory_engine = InventoryEngine()
