import React, { useState } from 'react';
import {
  Radio,
  PlusCircle,
  Filter,
  Play,
  Square,
  Sparkles,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { SeverityBadge } from '../components/StatusBadge';
import { EventItem, Shipment } from '../types';
import { api } from '../api/client';

interface EventsPageProps {
  events: EventItem[];
  shipments: Shipment[];
  onEventSubmitted: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  shipments,
  onEventSubmitted,
}) => {
  const [filterType, setFilterType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Manual Event Form state
  const [formEventType, setFormEventType] = useState('SHIPMENT_DELAYED');
  const [formShipmentId, setFormShipmentId] = useState(shipments[0]?.id || 'SHP-801');
  const [formSeverity, setFormSeverity] = useState('WARNING');
  const [formDelayMinutes, setFormDelayMinutes] = useState(30);
  const [formRainfall, setFormRainfall] = useState(40.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const filteredEvents = events.filter((ev) => {
    if (filterType && ev.event_type !== filterType) return false;
    if (filterSeverity && ev.severity !== filterSeverity) return false;
    return true;
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMsg(null);

    const payload: any = {};
    if (formEventType === 'SHIPMENT_DELAYED') {
      payload.delay_minutes = Number(formDelayMinutes);
      payload.reason = 'Manual Coordinator Delay Injection';
    } else if (formEventType === 'HEAVY_RAINFALL_WARNING') {
      payload.rainfall_mm = Number(formRainfall);
      payload.weather_severity = 0.75;
    } else if (formEventType === 'ROAD_CLOSURE_REPORTED') {
      payload.disruption_level = 0.9;
      payload.reason = 'Emergency Highway Obstruction';
    }

    try {
      await api.submitEvent({
        event_type: formEventType,
        source: 'MANUAL_DISPATCHER',
        shipment_id: formShipmentId,
        severity: formSeverity,
        payload,
      });
      setSubmitMsg('Event successfully ingested into pipeline.');
      onEventSubmitted();
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-600" />
            Live Event Stream & Ingestion Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            Real-time feed of incoming weather, route telemetry, inventory, and status transitions.
          </p>
        </div>
      </div>

      {/* Manual Event Injection Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-sky-600" />
          Simulate / Inject Real-Time Event
        </h3>
        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Event Type</label>
            <select
              value={formEventType}
              onChange={(e) => setFormEventType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 focus:bg-white"
            >
              <option value="SHIPMENT_DELAYED">SHIPMENT_DELAYED</option>
              <option value="HEAVY_RAINFALL_WARNING">HEAVY_RAINFALL_WARNING</option>
              <option value="ROAD_CLOSURE_REPORTED">ROAD_CLOSURE_REPORTED</option>
              <option value="INVENTORY_DECREASED">INVENTORY_DECREASED</option>
              <option value="SHIPMENT_DELIVERED">SHIPMENT_DELIVERED</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Shipment</label>
            <select
              value={formShipmentId}
              onChange={(e) => setFormShipmentId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 focus:bg-white"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.medicine_name.slice(0, 20)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Severity</label>
            <select
              value={formSeverity}
              onChange={(e) => setFormSeverity(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 focus:bg-white"
            >
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {formEventType === 'SHIPMENT_DELAYED' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delay (mins)</label>
              <input
                type="number"
                value={formDelayMinutes}
                onChange={(e) => setFormDelayMinutes(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 focus:bg-white"
                min="5"
                max="300"
              />
            </div>
          )}

          {formEventType === 'HEAVY_RAINFALL_WARNING' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Precipitation (mm)</label>
              <input
                type="number"
                value={formRainfall}
                onChange={(e) => setFormRainfall(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 focus:bg-white"
                min="0"
                max="200"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting...' : 'Submit Event'}</span>
            </button>
          </div>
        </form>

        {submitMsg && (
          <div className="mt-3 text-xs text-sky-800 bg-sky-50 border border-sky-200 p-2 rounded-lg font-mono">
            {submitMsg}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Stream:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Event Types</option>
            <option value="SHIPMENT_DELAYED">SHIPMENT_DELAYED</option>
            <option value="HEAVY_RAINFALL_WARNING">HEAVY_RAINFALL_WARNING</option>
            <option value="ROAD_CLOSURE_REPORTED">ROAD_CLOSURE_REPORTED</option>
            <option value="INVENTORY_DECREASED">INVENTORY_DECREASED</option>
            <option value="SHIPMENT_DELIVERED">SHIPMENT_DELIVERED</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <span className="text-slate-500 font-mono">
          Showing {filteredEvents.length} events
        </span>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Shipment / Target</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">{ev.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{ev.event_type}</td>
                  <td className="px-4 py-3 text-slate-600">{ev.source}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-sky-700">
                    {ev.shipment_id || ev.location_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={ev.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {ev.processing_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-400 truncate max-w-xs">
                    {ev.payload}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Drawer */}
      {selectedEvent && (
        <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-sm">{selectedEvent.event_type}</span>
              <span className="font-mono text-xs text-teal-400">{selectedEvent.id}</span>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Correlation ID</span>
              <span className="text-slate-200">{selectedEvent.correlation_id || 'LOCAL-TX'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Source</span>
              <span className="text-slate-200">{selectedEvent.source}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Processed At</span>
              <span className="text-slate-200">{new Date(selectedEvent.processed_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Severity</span>
              <span className="text-slate-200">{selectedEvent.severity}</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-1">Payload Content</span>
            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-teal-300 overflow-x-auto">
              {JSON.stringify(JSON.parse(selectedEvent.payload || '{}'), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
