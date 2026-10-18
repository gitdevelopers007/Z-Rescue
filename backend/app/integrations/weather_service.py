import time
import datetime
import httpx
from typing import Dict, Any, Optional
from backend.app.config import settings

class WeatherService:
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = settings.WEATHER_CACHE_TTL_SECONDS
        self.timeout = settings.WEATHER_TIMEOUT_SECONDS

    def get_weather(self, lat: float, lng: float, location_name: str = "Transit Point") -> Dict[str, Any]:
        """
        Retrieves weather condition via Open-Meteo API.
        If offline, timeout, or unreachable, falls back to deterministic simulated weather context
        and labels it clearly as simulated or cached.
        """
        cache_key = f"{round(lat, 2)}_{round(lng, 2)}"
        now = time.time()
        
        # Check cache
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if now - entry["cached_at"] < self.cache_ttl:
                return {
                    **entry["data"],
                    "data_source": "Open-Meteo (Cached)",
                    "is_stale": False,
                    "last_updated": entry["timestamp"]
                }
            elif now - entry["cached_at"] < (self.cache_ttl * 3):
                # Stale cached data
                return {
                    **entry["data"],
                    "data_source": "Open-Meteo (Stale Cache)",
                    "is_stale": True,
                    "last_updated": entry["timestamp"]
                }

        # Attempt live API fetch
        try:
            url = f"{settings.WEATHER_API_BASE_URL}/forecast"
            params = {
                "latitude": lat,
                "longitude": lng,
                "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
                "timezone": "auto"
            }
            with httpx.Client(timeout=self.timeout) as client:
                res = client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    current = data.get("current", {})
                    temp = current.get("temperature_2m", 25.0)
                    rain = current.get("rain", 0.0) + current.get("precipitation", 0.0)
                    wind = current.get("wind_speed_10m", 12.0)
                    code = current.get("weather_code", 0)

                    # Compute normalized weather severity (0.0 to 1.0)
                    severity = 0.0
                    if rain > 40:
                        severity = 0.85
                    elif rain > 15:
                        severity = 0.60
                    elif rain > 5:
                        severity = 0.35
                    if wind > 45:
                        severity = max(severity, 0.70)
                    elif wind > 30:
                        severity = max(severity, 0.40)

                    result = {
                        "temperature_celsius": temp,
                        "precipitation_mm": rain,
                        "wind_speed_kmh": wind,
                        "weather_code": code,
                        "weather_severity_score": round(severity, 2),
                        "summary": self._weather_code_to_summary(code, rain),
                        "data_source": "Open-Meteo Live API",
                        "is_stale": False,
                        "location_name": location_name,
                        "last_updated": datetime.datetime.utcnow().isoformat()
                    }

                    self.cache[cache_key] = {
                        "cached_at": now,
                        "timestamp": result["last_updated"],
                        "data": result
                    }
                    return result
        except Exception as e:
            # External network unavailable or timeout: Fallback gracefully
            pass

        # Simulated fallback
        simulated = self._generate_simulated_weather(lat, lng, location_name)
        return simulated

    def _weather_code_to_summary(self, code: int, rain: float) -> str:
        if rain > 25:
            return "Heavy Torrential Rain & Local Flooding Risk"
        if code in (61, 63, 65):
            return "Moderate to Heavy Rainfall"
        if code in (80, 81, 82):
            return "Rain Showers with Gusty Winds"
        if code in (95, 96, 99):
            return "Thunderstorm Alert"
        if code in (1, 2, 3):
            return "Partly Cloudy"
        return "Clear Sky & Favorable Transit Conditions"

    def _generate_simulated_weather(self, lat: float, lng: float, location_name: str) -> Dict[str, Any]:
        """Deterministic fallback when external API is unreachable."""
        return {
            "temperature_celsius": 24.5,
            "precipitation_mm": 0.0,
            "wind_speed_kmh": 14.0,
            "weather_code": 0,
            "weather_severity_score": 0.1,
            "summary": "Clear Skies (Simulated Fallback Context)",
            "data_source": "Open-Meteo Fallback Simulator (Offline Mode)",
            "is_stale": False,
            "location_name": location_name,
            "last_updated": datetime.datetime.utcnow().isoformat()
        }

weather_service = WeatherService()
