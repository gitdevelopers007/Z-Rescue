import os
import json
import joblib
import numpy as np
import datetime
from typing import Dict, Any, List, Tuple
from backend.app.config import settings

class RiskEngine:
    def __init__(self, model_path: str = None, meta_path: str = None):
        self.model_path = model_path or settings.MODEL_FILE_PATH
        self.meta_path = meta_path or settings.MODEL_METADATA_PATH
        self.model = None
        self.metadata = {}
        self.is_fallback = False
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.meta_path):
                self.model = joblib.load(self.model_path)
                with open(self.meta_path, "r") as f:
                    self.metadata = json.load(f)
                self.is_fallback = False
                print(f"[RiskEngine] Loaded trained ML model version {self.metadata.get('model_version')}")
            else:
                self.is_fallback = True
                self.metadata = {
                    "model_version": "1.0.0-rule-fallback",
                    "model_type": "DeterministicRuleBasedSafetyEngine",
                    "is_fallback": True
                }
                print("[RiskEngine] ML model file not found. Operating with rule-based safety fallback engine.")
        except Exception as e:
            self.is_fallback = True
            self.metadata = {
                "model_version": "1.0.0-rule-fallback",
                "model_type": "DeterministicRuleBasedSafetyEngine",
                "is_fallback": True,
                "error": str(e)
            }
            print(f"[RiskEngine] Failed loading ML model: {e}. Defaulting to rule-based safety engine.")

    def compute_risk(
        self,
        delay_minutes: int,
        weather_severity: float,
        rainfall_mm: float,
        road_closure_reported: bool,
        inventory_coverage_ratio: float,
        temp_deviation_celsius: float = 0.0,
        medicine_criticality: str = "HIGH",
        travel_progress_ratio: float = 0.5,
        planned_duration_minutes: int = 120
    ) -> Dict[str, Any]:
        """
        Computes the normalized risk score (0-100) and human-explainable factors.
        """
        crit_map = {"NORMAL": 1, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        crit_num = crit_map.get(medicine_criticality.upper(), 2)
        
        delay_ratio = delay_minutes / max(planned_duration_minutes, 30)
        
        factors: List[str] = []
        
        # Explainable factor detection
        if delay_minutes >= 45:
            factors.append(f"Transit delayed by {delay_minutes} minutes ({round(delay_ratio*100)}% of planned travel window)")
        elif delay_minutes > 15:
            factors.append(f"Minor delay detected ({delay_minutes} mins)")

        if road_closure_reported:
            factors.append("Active road closure reported along delivery corridor")
            
        if rainfall_mm >= 35.0:
            factors.append(f"Severe precipitation ({round(rainfall_mm, 1)} mm) impacting highway safety and speed")
        elif weather_severity >= 0.5:
            factors.append(f"Adverse weather warning active (Severity index: {round(weather_severity, 2)})")

        if inventory_coverage_ratio < 0.5:
            factors.append(f"Destination facility safety stock critically depleted (Coverage: {round(inventory_coverage_ratio*100)}%)")
        elif inventory_coverage_ratio < 1.0:
            factors.append(f"Destination inventory below recommended reserve (Coverage: {round(inventory_coverage_ratio*100)}%)")

        if temp_deviation_celsius > 2.0:
            factors.append(f"Cold-chain temperature excursion detected (+{round(temp_deviation_celsius, 1)}°C outside safe margin)")

        # Inference via ML Model or Safety Rules
        risk_score = 0.0
        
        if not self.is_fallback and self.model is not None:
            try:
                features = np.array([[
                    delay_ratio,
                    weather_severity,
                    rainfall_mm,
                    1 if road_closure_reported else 0,
                    inventory_coverage_ratio,
                    temp_deviation_celsius,
                    crit_num,
                    travel_progress_ratio
                ]])
                prob = self.model.predict_proba(features)[0, 1]
                # Scale calibrated probability to 0-100 risk score
                risk_score = round(float(prob * 100.0), 1)
            except Exception as e:
                print(f"[RiskEngine] ML Inference failed: {e}. Falling back to rule engine.")
                risk_score = self._compute_rule_score(
                    delay_minutes, weather_severity, rainfall_mm,
                    road_closure_reported, inventory_coverage_ratio,
                    temp_deviation_celsius, crit_num
                )
        else:
            risk_score = self._compute_rule_score(
                delay_minutes, weather_severity, rainfall_mm,
                road_closure_reported, inventory_coverage_ratio,
                temp_deviation_celsius, crit_num
            )

        # Enforce bounds 0 to 100
        risk_score = max(0.0, min(100.0, risk_score))
        
        # Categorize
        if risk_score <= settings.RISK_THRESHOLD_LOW:
            risk_category = "Low"
        elif risk_score <= settings.RISK_THRESHOLD_MODERATE:
            risk_category = "Moderate"
        elif risk_score <= settings.RISK_THRESHOLD_HIGH:
            risk_category = "High"
        else:
            risk_category = "Critical"

        # Action recommendation
        recommended_action = self._determine_action(risk_category, road_closure_reported, inventory_coverage_ratio, temp_deviation_celsius)

        if not factors:
            factors.append("Nominal transit conditions; no active disruptions detected")

        return {
            "risk_score": risk_score,
            "risk_category": risk_category,
            "prediction_timestamp": datetime.datetime.utcnow(),
            "prediction_horizon": "2 to 4 hours ahead",
            "contributing_factors": factors,
            "recommended_action": recommended_action,
            "model_version": self.metadata.get("model_version", "1.0.0-ibmz-rf"),
            "is_fallback": self.is_fallback,
            "data_freshness_seconds": 12.0
        }

    def _compute_rule_score(
        self,
        delay_minutes: int,
        weather_severity: float,
        rainfall_mm: float,
        road_closure_reported: bool,
        inventory_coverage_ratio: float,
        temp_deviation: float,
        crit_num: int
    ) -> float:
        score = 15.0  # baseline
        if delay_minutes > 15:
            score += min(30.0, delay_minutes * 0.5)
        if road_closure_reported:
            score += 35.0
        if weather_severity > 0.4:
            score += weather_severity * 20.0
        if rainfall_mm > 30:
            score += min(15.0, rainfall_mm * 0.2)
        if inventory_coverage_ratio < 0.5:
            score += 25.0
        elif inventory_coverage_ratio < 1.0:
            score += 15.0
        if temp_deviation > 2.0:
            score += min(20.0, temp_deviation * 4.0)
        score += (crit_num - 1) * 6.0
        return round(score, 1)

    def _determine_action(self, category: str, road_closure: bool, inv_cov: float, temp_dev: float) -> str:
        if category == "Critical":
            if road_closure:
                return "Immediate Coordinator Intervention: Reroute via verified arterial bypass and notify receiving ER coordinator."
            elif temp_dev > 2.0:
                return "Cold-Chain Critical: Direct vehicle to nearest cold-storage checkpoint for thermal inspection."
            elif inv_cov < 0.5:
                return "Emergency Expedite: Contact receiving hospital dispensary to authorize priority emergency reserve dispatch."
            else:
                return "Escalate to Chief Logistics Officer and verify secondary courier dispatch."
        elif category == "High":
            if road_closure:
                return "Evaluate verified alternative route and notify destination supply coordinator."
            elif inv_cov < 1.0:
                return "Pre-alert pharmacy team to hold safety stock for critical inpatient needs."
            else:
                return "Prioritize shipment monitoring; contact driver for transit checkpoint confirmation."
        elif category == "Moderate":
            return "Maintain standard operational monitoring; check weather and road updates at next checkpoint."
        else:
            return "Nominal transit: Continue scheduled telemetry tracking."

risk_engine = RiskEngine()
