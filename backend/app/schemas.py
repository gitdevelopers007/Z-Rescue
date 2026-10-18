import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Base Event Schemas
class EventCreate(BaseModel):
    id: Optional[str] = None
    event_type: str = Field(..., description="Type of the event, e.g. SHIPMENT_DELAYED, HEAVY_RAINFALL_WARNING")
    source: str = Field(default="TELEMETRY", description="Source of event")
    shipment_id: Optional[str] = None
    location_name: Optional[str] = None
    severity: str = Field(default="INFO", description="INFO, WARNING, HIGH, CRITICAL")
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[datetime.datetime] = None

class EventResponse(BaseModel):
    id: str
    event_type: str
    timestamp: datetime.datetime
    source: str
    shipment_id: Optional[str] = None
    location_name: Optional[str] = None
    severity: str
    payload: str
    processing_status: str
    processed_at: datetime.datetime
    correlation_id: Optional[str] = None

    class Config:
        from_attributes = True

# Shipment Schemas
class ShipmentBase(BaseModel):
    medicine_name: str
    medicine_category: str
    origin: str
    origin_lat: float = 12.9716
    origin_lng: float = 77.5946
    destination: str
    destination_lat: float = 13.0827
    destination_lng: float = 80.2707
    current_location_name: str
    current_lat: float = 13.0200
    current_lng: float = 78.8500
    dispatch_time: datetime.datetime
    expected_delivery_time: datetime.datetime
    current_estimated_delivery_time: datetime.datetime
    shipment_status: str = "IN_TRANSIT"
    priority: str = "HIGH"
    required_quantity: int = 100
    available_destination_inventory: int = 20
    safety_stock_threshold: int = 50
    supplier: str = "AeroMed Lifeline Supplies"
    temperature_sensitive: bool = True
    temp_celsius: float = 4.0
    delay_minutes: int = 0

class ShipmentCreate(ShipmentBase):
    id: Optional[str] = None

class ShipmentUpdate(BaseModel):
    current_location_name: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_estimated_delivery_time: Optional[datetime.datetime] = None
    shipment_status: Optional[str] = None
    priority: Optional[str] = None
    delay_minutes: Optional[int] = None
    temp_celsius: Optional[float] = None
    available_destination_inventory: Optional[int] = None

class ShipmentResponse(ShipmentBase):
    id: str
    current_disruption_risk: float
    risk_category: str
    weather_severity_score: float
    road_disruption_level: float
    last_updated: datetime.datetime

    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    severity: str
    alert_type: str
    shipment_id: Optional[str] = None
    inventory_id: Optional[str] = None
    title: str
    explanation: str
    evidence: str
    suggested_action: str
    status: str
    created_at: datetime.datetime
    acknowledged_at: Optional[datetime.datetime] = None
    resolved_at: Optional[datetime.datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: str = Field(..., description="ACKNOWLEDGED or RESOLVED")
    user: str = Field(default="Coordinator", description="User acknowledging/resolving the alert")

# Recommendation Schemas
class RecommendationResponse(BaseModel):
    id: str
    shipment_id: Optional[str] = None
    proposed_action: str
    reason: str
    supporting_evidence: str
    priority: str
    expected_operational_benefit: str
    requires_human_approval: bool
    is_approved: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryItemBase(BaseModel):
    medicine_name: str
    facility_name: str
    current_stock: int
    safety_stock: int
    average_hourly_consumption: float
    forecast_demand: int
    incoming_replenishment_quantity: int
    expected_replenishment_time: Optional[datetime.datetime] = None

class InventoryItemResponse(InventoryItemBase):
    id: str
    estimated_hours_remaining: float
    is_shortage_predicted: bool
    last_updated: datetime.datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime.datetime
    action_type: str
    entity_type: str
    entity_id: Optional[str] = None
    details: str
    model_version: Optional[str] = None
    correlation_id: Optional[str] = None
    user_actor: str

    class Config:
        from_attributes = True

# Risk Prediction Request & Response
class RiskPredictionRequest(BaseModel):
    shipment_id: Optional[str] = None
    delay_minutes: int = 0
    weather_severity: float = 0.0
    rainfall_mm: float = 0.0
    road_closure_reported: bool = False
    inventory_coverage_ratio: float = 1.0
    medicine_criticality: str = "HIGH"
    temp_deviation: float = 0.0

class RiskPredictionResponse(BaseModel):
    risk_score: float
    risk_category: str
    prediction_timestamp: datetime.datetime
    prediction_horizon: str
    contributing_factors: List[str]
    recommended_action: str
    model_version: str
    is_fallback: bool
    data_freshness_seconds: float

# Dashboard Summary
class DashboardSummary(BaseModel):
    total_active_shipments: int
    high_risk_shipments: int
    critical_risk_shipments: int
    critical_medicine_stock_alerts: int
    average_predicted_disruption_risk: float
    active_alerts_count: int
    deliveries_requiring_intervention: int
    system_mode: str
    is_demo_mode: bool
    processor_name: str
    last_refresh_timestamp: datetime.datetime
    risk_distribution: Dict[str, int]
    shipment_status_distribution: Dict[str, int]
