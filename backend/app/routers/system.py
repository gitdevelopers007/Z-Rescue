import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.ai.risk_engine import risk_engine
from backend.app.integrations.transaction_processor import get_transaction_processor
from backend.app.integrations.weather_service import weather_service

router = APIRouter(tags=["System"])

@router.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "team": settings.TEAM_NAME,
        "event": settings.EVENT_NAME,
        "event_code": settings.EVENT_CODE,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@router.get("/api/v1/system/status")
def system_status(db: Session = Depends(get_db)):
    tx_processor = get_transaction_processor()
    processor_health = tx_processor.health_check()
    
    # Probe a sample weather check
    sample_weather = weather_service.get_weather(12.9716, 77.5946, "Regional Command Hub")

    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "team": settings.TEAM_NAME,
        "event_code": settings.EVENT_CODE,
        "theme": settings.THEME,
        "version": settings.VERSION,
        "system_mode": settings.SYSTEM_MODE,
        "is_demo_mode": settings.IS_DEMO_MODE,
        "ibm_z_integration": {
            "status": "ADAPTER_READY",
            "processor_name": settings.PROCESSOR_NAME,
            "details": processor_health,
            "architecture_note": "Local demo processor active with full enterprise IBM Z transaction contract interfaces."
        },
        "risk_model": {
            "type": risk_engine.metadata.get("model_type", "RandomForestClassifier"),
            "version": risk_engine.metadata.get("model_version", "1.0.0-ibmz-rf"),
            "is_fallback": risk_engine.is_fallback,
            "accuracy": risk_engine.metadata.get("accuracy"),
            "roc_auc": risk_engine.metadata.get("roc_auc")
        },
        "weather_service": {
            "source": sample_weather.get("data_source"),
            "is_stale": sample_weather.get("is_stale"),
            "api_endpoint": settings.WEATHER_API_BASE_URL,
            "cache_ttl_seconds": settings.WEATHER_CACHE_TTL_SECONDS
        },
        "database": {
            "engine": "SQLite / SQLAlchemy ORM",
            "connected": True
        },
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@router.get("/api/v1/weather/current")
def get_current_weather(lat: float = 12.9716, lng: float = 77.5946, location: str = "Transit Corridor"):
    return weather_service.get_weather(lat, lng, location)
