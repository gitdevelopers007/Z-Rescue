import {
  Shipment,
  EventItem,
  AlertItem,
  RecommendationItem,
  InventoryItem,
  AuditLogItem,
  DashboardSummary,
  SystemStatus,
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch (_) {}
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getSummary: () => request<DashboardSummary>('/dashboard/summary'),

  // Shipments
  getShipments: (params?: { status?: string; risk_category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.risk_category) query.set('risk_category', params.risk_category);
    if (params?.search) query.set('search', params.search);
    return request<Shipment[]>(`/shipments?${query.toString()}`);
  },
  getShipment: (id: string) => request<Shipment>(`/shipments/${id}`),
  createShipment: (data: Partial<Shipment>) =>
    request<Shipment>('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id: string, data: Partial<Shipment>) =>
    request<Shipment>(`/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getShipmentTimeline: (id: string) => request<EventItem[]>(`/shipments/${id}/timeline`),

  // Events
  getEvents: (limit: number = 50) => request<EventItem[]>(`/events?limit=${limit}`),
  submitEvent: (event: {
    event_type: string;
    source?: string;
    shipment_id?: string;
    location_name?: string;
    severity?: string;
    payload?: any;
  }) => request<EventItem>('/events', { method: 'POST', body: JSON.stringify(event) }),

  // Alerts
  getAlerts: (status?: string, severity?: string) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (severity) q.set('severity', severity);
    return request<AlertItem[]>(`/alerts?${q.toString()}`);
  },
  updateAlertStatus: (id: string, status: 'ACKNOWLEDGED' | 'RESOLVED', user: string = 'Coordinator') =>
    request<AlertItem>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, user }),
    }),

  // Inventory
  getInventory: (shortageOnly: boolean = false) =>
    request<InventoryItem[]>(`/inventory?shortage_only=${shortageOnly}`),

  // Risk Model
  predictRisk: (params: any) =>
    request<any>('/risk/predict', { method: 'POST', body: JSON.stringify(params) }),
  getModelInfo: () => request<any>('/risk/model-info'),

  // Recommendations
  getRecommendations: () => request<RecommendationItem[]>('/recommendations'),
  approveRecommendation: (id: string, approver: string = 'Medical Logistics Director') =>
    request<RecommendationItem>(`/recommendations/${id}/approve?approver=${encodeURIComponent(approver)}`, {
      method: 'POST',
    }),

  // Audit
  getAuditLogs: (limit: number = 100) => request<AuditLogItem[]>(`/audit?limit=${limit}`),

  // System
  getSystemStatus: () => request<SystemStatus>('/system/status'),
  getCurrentWeather: (lat: number, lng: number, location: string) =>
    request<any>(`/weather/current?lat=${lat}&lng=${lng}&location=${encodeURIComponent(location)}`),

  // Demo Controls
  startDemoGenerator: () => request<any>('/demo/start', { method: 'POST' }),
  stopDemoGenerator: () => request<any>('/demo/stop', { method: 'POST' }),
  getDemoStatus: () => request<any>('/demo/status'),
  triggerScenarioStep: (step: number) =>
    request<any>(`/demo/scenario/step/${step}`, { method: 'POST' }),
  runFullScenario: () => request<any>('/demo/scenario/run', { method: 'POST' }),
  resetDemoDatabase: () => request<any>('/demo/reset', { method: 'POST' }),
};

// WebSocket factory
export function createEventWebSocket(onMessage: (data: any) => void): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/events`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[WebSocket] Connected to Z-Rescue live stream');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('[WebSocket] Failed parsing event frame', e);
    }
  };

  ws.onerror = (err) => {
    console.warn('[WebSocket] Warning/error on stream connection', err);
  };

  return ws;
}
