import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  Send,
  CheckCircle,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { Shipment } from '../types';
import { api } from '../api/client';

interface RouteWeatherPageProps {
  shipments: Shipment[];
  onSelectShipment: (id: string) => void;
  onRefresh: () => void;
}

export const RouteWeatherPage: React.FC<RouteWeatherPageProps> = ({
  shipments,
  onSelectShipment,
  onRefresh,
}) => {
  const [selectedId, setSelectedId] = useState<string>(shipments[0]?.id || '');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // User road closure report form
  const [reportLocation, setReportLocation] = useState('Ranipet Highway Bypass');
  const [reportDisruptionLevel, setReportDisruptionLevel] = useState(0.85);
  const [reportReason, setReportReason] = useState('Severe waterlogging / treefall across eastbound highway');
  const [targetShipmentId, setTargetShipmentId] = useState(shipments[0]?.id || 'SHP-802');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const selectedShipment = shipments.find((s) => s.id === selectedId) || shipments[0];

  useEffect(() => {
    if (selectedShipment) {
      setLoadingWeather(true);
      api
        .getCurrentWeather(
          selectedShipment.current_lat,
          selectedShipment.current_lng,
          selectedShipment.current_location_name
        )
        .then((data) => setWeatherData(data))
        .catch((e) => console.error(e))
        .finally(() => setLoadingWeather(false));
    }
  }, [selectedId]);

  const handleReportClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(null);
    try {
      await api.submitEvent({
        event_type: 'USER_ROAD_REPORT',
        source: 'USER_COMMUNITY_DISPATCH',
        shipment_id: targetShipmentId,
        location_name: reportLocation,
        severity: 'HIGH',
        payload: {
          disruption_level: Number(reportDisruptionLevel),
          reason: reportReason,
          is_user_reported: true,
          verification_status: 'UNVERIFIED_COMMUNITY_REPORT',
        },
      });
      setReportSuccess('Road incident reported successfully. Route disruption recomputed.');
      onRefresh();
    } catch (err: any) {
      setReportSuccess(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-600" />
          Live Route & Weather Environmental Monitor
        </h2>
        <p className="text-xs text-slate-500">
          OpenStreetMap corridor monitoring integrated with Open-Meteo weather intelligence and incident reporting.
        </p>
      </div>

      {/* Map & Live Weather Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Fleet Geospatial Coordinates</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Click pins to inspect waypoints & live risk
            </span>
          </div>
          <LeafletMap
            shipments={shipments}
            selectedShipmentId={selectedId}
            onSelectShipment={(id) => {
              setSelectedId(id);
              onSelectShipment(id);
            }}
            height="460px"
          />
        </div>

        {/* Selected Shipment Weather Context */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Weather Conditions at Waypoint
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                {selectedShipment ? selectedShipment.medicine_name : 'No selection'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Location: {selectedShipment?.current_location_name}
              </p>
            </div>

            {loadingWeather ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Polling Open-Meteo telemetry...
              </div>
            ) : weatherData ? (
              <div className="space-y-3 py-3 text-xs">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-center gap-3">
                  <CloudRain className="w-8 h-8 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-950 block">{weatherData.summary}</span>
                    <span className="text-[11px] text-sky-800 font-mono">
                      Severity Index: {(weatherData.weather_severity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Thermometer className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-400 text-[10px] block">Temp</span>
                    <span className="font-bold text-slate-900">{weatherData.temperature_celsius}°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <CloudRain className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-400 text-[10px] block">Rain</span>
                    <span className="font-bold text-slate-900">{weatherData.precipitation_mm} mm</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Wind className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-400 text-[10px] block">Wind</span>
                    <span className="font-bold text-slate-900">{weatherData.wind_speed_kmh} km/h</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono space-y-0.5 pt-1">
                  <div>Source: <strong>{weatherData.data_source}</strong></div>
                  <div>Last Updated: {new Date(weatherData.last_updated).toLocaleTimeString()}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>Open-Meteo Resiliency:</strong> If external internet drops, deterministic offline simulation safely caches readings.
          </div>
        </div>
      </div>

      {/* User Road Closure Incident Reporter */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Report Road Hazard / Route Disruption
            </h3>
            <p className="text-xs text-slate-500">
              Community and driver road closure submission. Clearly distinguished from verified highway authority data.
            </p>
          </div>
        </div>

        <form onSubmit={handleReportClosure} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Impacted Corridor / Checkpoint</label>
            <input
              type="text"
              required
              value={reportLocation}
              onChange={(e) => setReportLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Affected Shipment</label>
            <select
              value={targetShipmentId}
              onChange={(e) => setTargetShipmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 bg-white"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} ({s.medicine_name.slice(0, 20)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Hazard Nature</label>
            <input
              type="text"
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Report Road Hazard</span>
            </button>
          </div>
        </form>

        {reportSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-mono border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reportSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
};
