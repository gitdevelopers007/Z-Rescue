import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Z-Rescue"
    APP_TITLE: str = "Z-Rescue | IBM Z Datathon 2026"
    TEAM_NAME: str = "UNI MIND"
    EVENT_NAME: str = "IBM Z Datathon 2026"
    EVENT_CODE: str = "SSF2026"
    THEME: str = "Real-Time AI for Critical Decisions"
    TAGLINE: str = "Predict Early. Respond Faster. Protect Essential Supplies."
    VERSION: str = "1.0.0"
    
    # Server & CORS
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./z_rescue.db"
    
    # Mode
    SYSTEM_MODE: str = "demo"  # "demo" or "connected"
    IS_DEMO_MODE: bool = True
    PROCESSOR_NAME: str = "Local Demo Processor — IBM Z integration adapter ready"
    
    # Weather
    WEATHER_API_BASE_URL: str = "https://api.open-meteo.com/v1"
    WEATHER_CACHE_TTL_SECONDS: int = 1800
    WEATHER_TIMEOUT_SECONDS: float = 4.0
    
    # IBM Z Integration Adapter Config
    IBM_Z_ENDPOINT: str = "https://mock-ibm-z-zos.internal.ibm.com/v1/tx"
    IBM_Z_API_KEY: str = ""
    IBM_Z_CORRELATION_PREFIX: str = "Z-RESCUE-TX"
    IBM_Z_TIMEOUT_SECONDS: float = 3.0
    IBM_Z_MAX_RETRIES: int = 2
    
    # AI Risk Thresholds
    RISK_THRESHOLD_LOW: int = 29
    RISK_THRESHOLD_MODERATE: int = 59
    RISK_THRESHOLD_HIGH: int = 79
    RISK_THRESHOLD_CRITICAL: int = 100
    
    # Paths
    MODEL_FILE_PATH: str = str(BASE_DIR / "backend" / "app" / "ai" / "risk_model.joblib")
    MODEL_METADATA_PATH: str = str(BASE_DIR / "backend" / "app" / "ai" / "model_metadata.json")
    
    # Demo Generator Defaults
    DEMO_GENERATOR_INTERVAL_SECONDS: int = 4
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
