import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  Thermometer,
  ShieldAlert,
  Boxes,
  Activity,
  History,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { RiskBadge, StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { Shipment, EventItem, RecommendationItem } from '../types';
import { api } from '../api/client';

interface ShipmentDetailPageProps {
  shipmentId: string | null;
  onBack: () => void;
  onApproveRecommendation: (id: string) => void;
}

export const ShipmentDetailPage: React.FC<ShipmentDetailPageProps> = ({
  shipmentId,
  onBack,
  onApproveRecommendation,
}) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [timeline, setTimeline] = useState<EventItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shipmentId) return;
    setLoading(true);
    Promise.all([
      api.getShipment(shipmentId),
      api.getShipmentTimeline(shipmentId),
      api.getRecommendations(),
    ])
      .then(([shp, events, recs]) => {
        setShipment(shp);
        setTimeline(events);
        setRecommendations(recs.filter((r) => r.shipment_id === shipmentId));
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [shipmentId]);

  if (!shipmentId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <Truck className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Shipment Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please select a shipment from the fleet list or dashboard to inspect telemetry and risk breakdown.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white"
        >
          Go to Shipments List
        </button>
      </div>
    );
  }

  if (loading || !shipment) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 font-mono">
        Loading shipment telemetry for {shipmentId}...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shipments</span>
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={shipment.shipment_status} />
          <RiskBadge category={shipment.risk_category} score={shipment.current_disruption_risk} size="lg" />
        </div>
      </div>

      {/* Main Title & Key Specs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{shipment.medicine_name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {shipment.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Category: <strong>{shipment.medicine_category}</strong> | Supplier:{' '}
              <strong>{shipment.supplier}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase font-semibold">Priority Classification</span>
            <span
              className={`text-sm font-bold ${
                shipment.priority === 'CRITICAL' ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {shipment.priority} CLINICAL URGENCY
            </span>
          </div>
        </div>

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" /> Current Checkpoint
            </span>
            <div className="font-bold text-slate-900">{shipment.current_location_name}</div>
            <div className="text-[11px] font-mono text-slate-400">
              {shipment.current_lat.toFixed(4)}, {shipment.current_lng.toFixed(4)}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Schedule & Delay
            </span>
            <div className="font-bold text-slate-900">
              {shipment.delay_minutes > 0 ? `+${shipment.delay_minutes} mins delay` : 'Nominal Schedule'}
            </div>
            <div className="text-[11px] text-slate-500">
              ETA: {new Date(shipment.current_estimated_delivery_time).toLocaleTimeString()}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-indigo-600" /> Destination Reserve Stock
            </span>
            <div className="font-bold text-slate-900">
              {shipment.available_destination_inventory} / {shipment.safety_stock_threshold} units
            </div>
            <div className="text-[11px] text-slate-500">
              {shipment.available_destination_inventory < shipment.safety_stock_threshold ? (
                <span className="text-rose-600 font-semibold">Deficit below safety stock</span>
              ) : (
                <span className="text-emerald-600">Stock buffer intact</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-teal-600" /> Thermal Envelope
            </span>
            <div className="font-bold text-slate-900">
              {shipment.temperature_sensitive ? `${shipment.temp_celsius}°C (Cold Chain)` : 'Ambient Transport'}
            </div>
            <div className="text-[11px] text-slate-500">
              {shipment.temperature_sensitive ? 'Target: 2.0°C – 8.0°C' : 'Standard container'}
            </div>
          </div>
        </div>

        {/* Explainable AI Risk Factor Card */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Explainable Risk Assessment & Factors
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Model: Random Forest Classifier v1.0
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {shipment.risk_category === 'Critical'
              ? 'Risk score is severely elevated. Accumulated highway congestion, adverse rainfall along route, and low destination facility reserve combine to predict delivery disruption.'
              : shipment.risk_category === 'High'
              ? 'Moderate-to-high probability of delivery disruption detected based on transit progress and regional weather telemetry.'
              : 'Shipment is tracking within nominal operational tolerances with no critical bottlenecks.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Weather Severity</span>
              <span className="text-white font-bold">{(shipment.weather_severity_score * 100).toFixed(0)}% Index</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Road Obstruction</span>
              <span className="text-white font-bold">{(shipment.road_disruption_level * 100).toFixed(0)}% Level</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Calculated Disruption Likelihood</span>
              <span className="text-teal-300 font-bold">{shipment.current_disruption_risk}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations for this shipment */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-sky-600" />
            Decision Recommendations for {shipment.id}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rec.proposed_action}</span>
                  <SeverityBadge severity={rec.priority} />
                </div>
                <p className="text-slate-600">{rec.reason}</p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Benefit: {rec.expected_operational_benefit}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  {rec.is_approved ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Action Authorized
                    </span>
                  ) : (
                    <button
                      onClick={() => onApproveRecommendation(rec.id)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold transition"
                    >
                      Authorize Action
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipment Event Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-sky-600" />
          Audit Timeline of Ingested Telemetry
        </h3>

        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No historical events recorded for this shipment yet.</p>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-4 pl-4 text-xs">
            {timeline.map((ev) => (
              <div key={ev.id} className="relative">
                <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{ev.event_type}</span>
                  <SeverityBadge severity={ev.severity} />
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {new Date(ev.timestamp).toLocaleString()} | Source: {ev.source}
                </div>
                <div className="mt-1 p-2 rounded bg-slate-50 font-mono text-[11px] text-slate-700 border border-slate-100">
                  {ev.payload}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
