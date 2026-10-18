from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Shipment
from backend.app.schemas import RiskPredictionRequest, RiskPredictionResponse
from backend.app.ai.risk_engine import risk_engine

router = APIRouter(prefix="/api/v1/risk", tags=["Risk Engine"])

@router.post("/predict", response_model=RiskPredictionResponse)
def predict_risk(req: RiskPredictionRequest, db: Session = Depends(get_db)):
    # If shipment_id supplied, pull current baseline stats
    if req.shipment_id:
        shp = db.query(Shipment).filter(Shipment.id == req.shipment_id).first()
        if shp:
            delay = req.delay_minutes if req.delay_minutes > 0 else shp.delay_minutes
            weather = req.weather_severity if req.weather_severity > 0.0 else shp.weather_severity_score
            closure = req.road_closure_reported or (shp.road_disruption_level >= 0.6)
            cov = req.inventory_coverage_ratio if req.inventory_coverage_ratio != 1.0 else (shp.available_destination_inventory / max(shp.safety_stock_threshold, 1))
            crit = req.medicine_criticality or shp.priority
            temp_dev = req.temp_deviation if req.temp_deviation > 0.0 else abs(shp.temp_celsius - 4.0)

            result = risk_engine.compute_risk(
                delay_minutes=delay,
                weather_severity=weather,
                rainfall_mm=req.rainfall_mm,
                road_closure_reported=closure,
                inventory_coverage_ratio=cov,
                temp_deviation_celsius=temp_dev,
                medicine_criticality=crit
            )
            return RiskPredictionResponse(**result)

    result = risk_engine.compute_risk(
        delay_minutes=req.delay_minutes,
        weather_severity=req.weather_severity,
        rainfall_mm=req.rainfall_mm,
        road_closure_reported=req.road_closure_reported,
        inventory_coverage_ratio=req.inventory_coverage_ratio,
        temp_deviation_celsius=req.temp_deviation,
        medicine_criticality=req.medicine_criticality
    )
    return RiskPredictionResponse(**result)

@router.get("/model-info")
def get_model_info():
    return {
        "status": "LOADED" if not risk_engine.is_fallback else "RULE_FALLBACK_ACTIVE",
        "metadata": risk_engine.metadata,
        "is_fallback": risk_engine.is_fallback,
        "features": [
            {"name": "delay_ratio", "description": "Normalized ratio of accumulated transit delay to planned schedule"},
            {"name": "weather_severity", "description": "Atmospheric risk index from Open-Meteo telemetry (0.0 to 1.0)"},
            {"name": "rainfall_mm", "description": "Precipitation volume reported along highway corridor"},
            {"name": "road_closure_flag", "description": "Binary obstruction indicator from highway police or user report"},
            {"name": "inventory_coverage_ratio", "description": "On-hand facility inventory vs clinical safety stock"},
            {"name": "temp_deviation_celsius", "description": "Absolute excursion outside 2°C - 8°C cold chain target"},
            {"name": "medicine_criticality_num", "description": "Standardized urgency weight (1: Normal, 2: High, 3: Critical)"},
            {"name": "travel_progress_ratio", "description": "Portion of delivery corridor traversed"}
        ],
        "thresholds": {
            "Low": "0 - 29",
            "Moderate": "30 - 59",
            "High": "60 - 79",
            "Critical": "80 - 100"
        }
    }
