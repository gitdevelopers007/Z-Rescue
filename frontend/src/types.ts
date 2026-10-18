export interface Shipment {
  id: string;
  medicine_name: string;
  medicine_category: string;
  origin: string;
  origin_lat: number;
  origin_lng: number;
  destination: string;
  destination_lat: number;
  destination_lng: number;
  current_location_name: string;
  current_lat: number;
  current_lng: number;
  dispatch_time: string;
  expected_delivery_time: string;
  current_estimated_delivery_time: string;
  shipment_status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELAYED' | 'REROUTED' | 'DELIVERED' | 'CANCELLED';
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  required_quantity: number;
  available_destination_inventory: number;
  safety_stock_threshold: number;
  supplier: string;
  current_disruption_risk: number;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Critical';
  temperature_sensitive: boolean;
  temp_celsius: number;
  delay_minutes: number;
  weather_severity_score: number;
  road_disruption_level: number;
  last_updated: string;
}

export interface EventItem {
  id: string;
  event_type: string;
  timestamp: string;
  source: string;
  shipment_id?: string;
  location_name?: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  payload: string;
  processing_status: string;
  processed_at: string;
  correlation_id?: string;
}

export interface AlertItem {
  id: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  alert_type: string;
  shipment_id?: string;
  inventory_id?: string;
  title: string;
  explanation: string;
  evidence: string;
  suggested_action: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: string;
  resolved_by?: string;
}

export interface RecommendationItem {
  id: string;
  shipment_id?: string;
  proposed_action: string;
  reason: string;
  supporting_evidence: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_operational_benefit: string;
  requires_human_approval: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  medicine_name: string;
  facility_name: string;
  current_stock: number;
  safety_stock: number;
  average_hourly_consumption: number;
  forecast_demand: number;
  incoming_replenishment_quantity: number;
  expected_replenishment_time?: string;
  estimated_hours_remaining: number;
  is_shortage_predicted: boolean;
  last_updated: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  model_version?: string;
  correlation_id?: string;
  user_actor: string;
}

export interface DashboardSummary {
  total_active_shipments: number;
  high_risk_shipments: number;
  critical_risk_shipments: number;
  critical_medicine_stock_alerts: number;
  average_predicted_disruption_risk: number;
  active_alerts_count: number;
  deliveries_requiring_intervention: number;
  system_mode: string;
  is_demo_mode: boolean;
  processor_name: string;
  last_refresh_timestamp: string;
  risk_distribution: Record<string, number>;
  shipment_status_distribution: Record<string, number>;
}

export interface SystemStatus {
  project: string;
  tagline: string;
  team: string;
  event_code: string;
  theme: string;
  version: string;
  system_mode: string;
  is_demo_mode: boolean;
  ibm_z_integration: {
    status: string;
    processor_name: string;
    details: any;
    architecture_note: string;
  };
  risk_model: {
    type: string;
    version: string;
    is_fallback: boolean;
    accuracy?: number;
    roc_auc?: number;
  };
  weather_service: {
    source: string;
    is_stale: boolean;
    api_endpoint: string;
  };
  database: {
    engine: string;
    connected: boolean;
  };
}
