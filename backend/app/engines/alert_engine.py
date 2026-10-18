import json
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import Shipment, Alert, AuditLog

class AlertEngine:
    @staticmethod
    def evaluate_shipment_alerts(shipment: Shipment, db: Session) -> List[Alert]:
        """
        Evaluates operational thresholds and anomaly conditions for a shipment.
        Creates alerts with deduplication protection.
        """
        created_alerts: List[Alert] = []
        now = datetime.datetime.utcnow()

        # 1. Critical Disruption Risk Alert
        if shipment.current_disruption_risk >= 80.0:
            alert = AlertEngine._create_or_update_alert(
                db=db,
                shipment_id=shipment.id,
                alert_type="CRITICAL_DISRUPTION_RISK",
                severity="CRITICAL",
                title=f"Critical Delivery Risk: {shipment.medicine_name} ({shipment.id})",
                explanation=(
                    f"Predicted disruption probability escalated to {shipment.current_disruption_risk}%. "
                    f"Current delay is {shipment.delay_minutes} minutes, destination inventory at "
                    f"{shipment.available_destination_inventory} units (threshold: {shipment.safety_stock_threshold})."
                ),
                evidence=json.dumps({
                    "risk_score": shipment.current_disruption_risk,
                    "delay_minutes": shipment.delay_minutes,
                    "available_inventory": shipment.available_destination_inventory,
                    "road_disruption_level": shipment.road_disruption_level,
                    "weather_severity": shipment.weather_severity_score
                }),
                suggested_action="Immediate dispatch coordinator intervention required. Verify secondary arterial bypass and notify emergency facility director."
            )
            if alert:
                created_alerts.append(alert)

        elif shipment.current_disruption_risk >= 60.0:
            alert = AlertEngine._create_or_update_alert(
                db=db,
                shipment_id=shipment.id,
                alert_type="HIGH_DISRUPTION_RISK",
                severity="HIGH",
                title=f"Elevated Disruption Risk: {shipment.medicine_name} ({shipment.id})",
                explanation=f"AI risk model indicates high delivery disruption likelihood ({shipment.current_disruption_risk}%).",
                evidence=json.dumps({
                    "risk_score": shipment.current_disruption_risk,
                    "delay_minutes": shipment.delay_minutes
                }),
                suggested_action="Review route telemetry and contact logistics carrier for updated ETA verification."
            )
            if alert:
                created_alerts.append(alert)

        # 2. Road Closure Alert
        if shipment.road_disruption_level >= 0.7:
            alert = AlertEngine._create_or_update_alert(
                db=db,
                shipment_id=shipment.id,
                alert_type="ROAD_CLOSURE_ROUTE",
                severity="CRITICAL" if shipment.priority == "CRITICAL" else "HIGH",
                title=f"Delivery Route Blocked: {shipment.id}",
                explanation=f"Active road blockage or closure reported along planned corridor between {shipment.origin} and {shipment.destination}.",
                evidence=json.dumps({
                    "road_disruption_level": shipment.road_disruption_level,
                    "current_location": shipment.current_location_name
                }),
                suggested_action="Execute verified emergency alternate corridor bypass immediately."
            )
            if alert:
                created_alerts.append(alert)

        # 3. Weather Warning Alert
        if shipment.weather_severity_score >= 0.65:
            alert = AlertEngine._create_or_update_alert(
                db=db,
                shipment_id=shipment.id,
                alert_type="WEATHER_WARNING_ROUTE",
                severity="HIGH",
                title=f"Adverse Weather Impact: Route {shipment.id}",
                explanation=f"Severe precipitation or storm alert detected in transit zone ({shipment.current_location_name}).",
                evidence=json.dumps({"weather_severity": shipment.weather_severity_score}),
                suggested_action="Instruct driver to engage wet-weather transit protocols and monitor hydroplaning warnings."
            )
            if alert:
                created_alerts.append(alert)

        # 4. Temperature Sensitivity Excursion
        if shipment.temperature_sensitive and (shipment.temp_celsius < 2.0 or shipment.temp_celsius > 8.0):
            alert = AlertEngine._create_or_update_alert(
                db=db,
                shipment_id=shipment.id,
                alert_type="COLD_CHAIN_TEMPERATURE_EXCURSION",
                severity="CRITICAL",
                title=f"Cold-Chain Thermal Excursion: {shipment.medicine_name} ({shipment.temp_celsius}°C)",
                explanation=f"Storage container temperature ({shipment.temp_celsius}°C) outside required 2.0°C - 8.0°C clinical range.",
                evidence=json.dumps({"temp_celsius": shipment.temp_celsius, "threshold_range": "2-8C"}),
                suggested_action="Direct driver to nearest emergency cold-storage facility and inspect data-logger seal."
            )
            if alert:
                created_alerts.append(alert)

        return created_alerts

    @staticmethod
    def _create_or_update_alert(
        db: Session,
        shipment_id: str,
        alert_type: str,
        severity: str,
        title: str,
        explanation: str,
        evidence: str,
        suggested_action: str
    ) -> Optional[Alert]:
        # Deduplication check: Do not re-create if NEW alert exists with same type
        existing = db.query(Alert).filter(
            Alert.shipment_id == shipment_id,
            Alert.alert_type == alert_type,
            Alert.status == "NEW"
        ).first()

        if existing:
            # Duplicate suppressed
            return None

        import uuid
        alert_id = f"ALT-{alert_type[:4]}-{shipment_id}-{uuid.uuid4().hex[:8].upper()}"
        new_alert = Alert(
            id=alert_id,
            severity=severity,
            alert_type=alert_type,
            shipment_id=shipment_id,
            title=title,
            explanation=explanation,
            evidence=evidence,
            suggested_action=suggested_action,
            status="NEW",
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_alert)

        audit = AuditLog(
            id=f"AUD-ALT-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000}",
            action_type="ALERT_CREATED",
            entity_type="ALERT",
            entity_id=alert_id,
            details=f"Created {severity} alert '{title}' for shipment {shipment_id}",
            user_actor="ALERT_ENGINE"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_alert)
        return new_alert

    @staticmethod
    def acknowledge_alert(alert_id: str, user: str, db: Session) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_at = datetime.datetime.utcnow()
        alert.acknowledged_by = user
        
        audit = AuditLog(
            id=f"AUD-ACK-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000}",
            action_type="ALERT_ACKNOWLEDGED",
            entity_type="ALERT",
            entity_id=alert.id,
            details=f"Alert acknowledged by {user}",
            user_actor=user
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(alert_id: str, user: str, db: Session) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.datetime.utcnow()
        alert.resolved_by = user
        
        audit = AuditLog(
            id=f"AUD-RES-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000}",
            action_type="ALERT_RESOLVED",
            entity_type="ALERT",
            entity_id=alert.id,
            details=f"Alert resolved by {user}",
            user_actor=user
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

alert_engine = AlertEngine()
