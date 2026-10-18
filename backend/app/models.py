import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(50), primary_key=True, index=True)
    medicine_name = Column(String(150), nullable=False, index=True)
    medicine_category = Column(String(100), nullable=False, index=True)
    origin = Column(String(200), nullable=False)
    origin_lat = Column(Float, nullable=False, default=12.9716)
    origin_lng = Column(Float, nullable=False, default=77.5946)
    destination = Column(String(200), nullable=False)
    destination_lat = Column(Float, nullable=False, default=13.0827)
    destination_lng = Column(Float, nullable=False, default=80.2707)
    current_location_name = Column(String(200), nullable=False)
    current_lat = Column(Float, nullable=False, default=13.0200)
    current_lng = Column(Float, nullable=False, default=78.8500)
    dispatch_time = Column(DateTime, nullable=False)
    expected_delivery_time = Column(DateTime, nullable=False)
    current_estimated_delivery_time = Column(DateTime, nullable=False)
    shipment_status = Column(String(50), nullable=False, default="IN_TRANSIT", index=True)
    priority = Column(String(30), nullable=False, default="HIGH", index=True)
    required_quantity = Column(Integer, nullable=False, default=100)
    available_destination_inventory = Column(Integer, nullable=False, default=20)
    safety_stock_threshold = Column(Integer, nullable=False, default=50)
    supplier = Column(String(150), nullable=False, default="AeroMed Lifeline Supplies")
    current_disruption_risk = Column(Float, nullable=False, default=15.0)
    risk_category = Column(String(30), nullable=False, default="Low", index=True)
    temperature_sensitive = Column(Boolean, nullable=False, default=True)
    temp_celsius = Column(Float, nullable=False, default=4.0)
    delay_minutes = Column(Integer, nullable=False, default=0)
    weather_severity_score = Column(Float, nullable=False, default=0.0)
    road_disruption_level = Column(Float, nullable=False, default=0.0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    events = relationship("Event", back_populates="shipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="shipment", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="shipment", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"

    id = Column(String(60), primary_key=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source = Column(String(80), nullable=False, default="TELEMETRY")
    shipment_id = Column(String(50), ForeignKey("shipments.id", ondelete="SET NULL"), nullable=True, index=True)
    location_name = Column(String(200), nullable=True)
    severity = Column(String(30), nullable=False, default="INFO")
    payload = Column(Text, nullable=False, default="{}")
    processing_status = Column(String(40), nullable=False, default="PROCESSED", index=True)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    correlation_id = Column(String(80), nullable=True)

    shipment = relationship("Shipment", back_populates="events")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(60), primary_key=True, index=True)
    severity = Column(String(30), nullable=False, default="WARNING", index=True)
    alert_type = Column(String(80), nullable=False, index=True)
    shipment_id = Column(String(50), ForeignKey("shipments.id", ondelete="SET NULL"), nullable=True, index=True)
    inventory_id = Column(String(60), ForeignKey("inventory_items.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False, default="{}")
    suggested_action = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="NEW", index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    resolved_by = Column(String(100), nullable=True)

    shipment = relationship("Shipment", back_populates="alerts")
    inventory = relationship("InventoryItem", back_populates="alerts")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(60), primary_key=True, index=True)
    shipment_id = Column(String(50), ForeignKey("shipments.id", ondelete="SET NULL"), nullable=True, index=True)
    proposed_action = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=False)
    priority = Column(String(30), nullable=False, default="HIGH", index=True)
    expected_operational_benefit = Column(Text, nullable=False)
    requires_human_approval = Column(Boolean, nullable=False, default=True)
    is_approved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    shipment = relationship("Shipment", back_populates="recommendations")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(60), primary_key=True, index=True)
    medicine_name = Column(String(150), nullable=False, index=True)
    facility_name = Column(String(200), nullable=False, index=True)
    current_stock = Column(Integer, nullable=False, default=50)
    safety_stock = Column(Integer, nullable=False, default=30)
    average_hourly_consumption = Column(Float, nullable=False, default=2.5)
    forecast_demand = Column(Integer, nullable=False, default=60)
    incoming_replenishment_quantity = Column(Integer, nullable=False, default=100)
    expected_replenishment_time = Column(DateTime, nullable=True)
    estimated_hours_remaining = Column(Float, nullable=False, default=20.0)
    is_shortage_predicted = Column(Boolean, nullable=False, default=False, index=True)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    alerts = relationship("Alert", back_populates="inventory")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(60), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    action_type = Column(String(80), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(60), nullable=True)
    details = Column(Text, nullable=False)
    model_version = Column(String(50), nullable=True)
    correlation_id = Column(String(80), nullable=True)
    user_actor = Column(String(100), nullable=False, default="SYSTEM_PIPELINE")

# Index optimization
Index("idx_events_shipment_time", Event.shipment_id, Event.timestamp)
Index("idx_alerts_status_severity", Alert.status, Alert.severity)
