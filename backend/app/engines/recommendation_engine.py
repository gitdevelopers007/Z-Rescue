import uuid
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import Shipment, Recommendation, AuditLog

class RecommendationEngine:
    @staticmethod
    def generate_recommendations(shipment: Shipment, db: Session) -> List[Recommendation]:
        """
        Synthesizes operational recommendations based on multi-factor telemetry.
        Each recommendation requires explicit human verification and approval.
        """
        recs: List[Recommendation] = []
        now = datetime.datetime.utcnow()

        # Recommendation 1: Rerouting Evaluation
        if shipment.road_disruption_level >= 0.6 or shipment.weather_severity_score >= 0.7:
            existing = db.query(Recommendation).filter(
                Recommendation.shipment_id == shipment.id,
                Recommendation.proposed_action.like("%alternative corridor%")
            ).first()
            if not existing:
                rec = Recommendation(
                    id=f"REC-RTE-{shipment.id}-{uuid.uuid4().hex[:8].upper()}",
                    shipment_id=shipment.id,
                    proposed_action=f"Evaluate simulated arterial detour via Highway 44 Bypass around {shipment.current_location_name}.",
                    reason=f"Severe obstruction / weather risk along primary corridor (Disruption score: {round(shipment.road_disruption_level, 2)}).",
                    supporting_evidence=f"Active blockage telemetry near {shipment.current_location_name}; estimated delay reduction: 35 minutes.",
                    priority="HIGH",
                    expected_operational_benefit="Bypasses flood and road closures, preserving shipment integrity and avoiding critical delay.",
                    requires_human_approval=True,
                    is_approved=False,
                    created_at=now
                )
                db.add(rec)
                recs.append(rec)

        # Recommendation 2: Inventory Pre-Alert & Reserve Allocation
        if shipment.available_destination_inventory <= shipment.safety_stock_threshold:
            existing = db.query(Recommendation).filter(
                Recommendation.shipment_id == shipment.id,
                Recommendation.proposed_action.like("%quarantine reserve%")
            ).first()
            if not existing:
                rec = Recommendation(
                    id=f"REC-INV-{shipment.id}-{uuid.uuid4().hex[:8].upper()}",
                    shipment_id=shipment.id,
                    proposed_action=f"Alert {shipment.destination} dispensary to quarantine safety stock buffer for priority ICU patients.",
                    reason=f"On-site inventory ({shipment.available_destination_inventory} units) is below safety stock minimum ({shipment.safety_stock_threshold} units).",
                    supporting_evidence=f"Delayed arrival projected for {shipment.medicine_name}. Current transit delay: {shipment.delay_minutes} mins.",
                    priority="CRITICAL" if shipment.current_disruption_risk >= 75 else "HIGH",
                    expected_operational_benefit="Prevents sudden out-of-stock emergency in trauma/ICU wards prior to delayed delivery arrival.",
                    requires_human_approval=True,
                    is_approved=False,
                    created_at=now
                )
                db.add(rec)
                recs.append(rec)

        # Recommendation 3: Cold-Chain Thermal Inspection
        if shipment.temperature_sensitive and (shipment.temp_celsius > 6.0 or shipment.temp_celsius < 2.5):
            existing = db.query(Recommendation).filter(
                Recommendation.shipment_id == shipment.id,
                Recommendation.proposed_action.like("%thermal inspection%")
            ).first()
            if not existing:
                rec = Recommendation(
                    id=f"REC-COLD-{shipment.id}-{uuid.uuid4().hex[:8].upper()}",
                    shipment_id=shipment.id,
                    proposed_action=f"Direct carrier to conduct certified temperature logger verification at next waystation.",
                    reason=f"Container temperature ({shipment.temp_celsius}°C) is bordering unsafe clinical boundaries for {shipment.medicine_name}.",
                    supporting_evidence=f"Telemetry indicates ambient heat or insulation stress near {shipment.current_location_name}.",
                    priority="CRITICAL",
                    expected_operational_benefit="Preserves active pharmaceutical ingredient potency and avoids discarded supplies.",
                    requires_human_approval=True,
                    is_approved=False,
                    created_at=now
                )
                db.add(rec)
                recs.append(rec)

        if recs:
            db.commit()
            for r in recs:
                db.refresh(r)
        return recs

    @staticmethod
    def approve_recommendation(rec_id: str, approver_name: str, db: Session) -> Optional[Recommendation]:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return None
        rec.is_approved = True
        
        audit = AuditLog(
            id=f"AUD-REC-APP-{int(datetime.datetime.utcnow().timestamp() * 1000) % 1000000}",
            action_type="RECOMMENDATION_APPROVED",
            entity_type="RECOMMENDATION",
            entity_id=rec.id,
            details=f"Operational recommendation approved by coordinator {approver_name}: {rec.proposed_action}",
            user_actor=approver_name
        )
        db.add(audit)
        db.commit()
        db.refresh(rec)
        return rec

recommendation_engine = RecommendationEngine()
