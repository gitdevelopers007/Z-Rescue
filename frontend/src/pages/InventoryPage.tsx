import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  TrendingDown,
  Building,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { api } from '../api/client';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shortageFilter, setShortageFilter] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    api
      .getInventory(shortageFilter)
      .then((data) => setItems(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, [shortageFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-sky-600" />
            Hospital Inventory & Medicine Shortage Forecast
          </h2>
          <p className="text-xs text-slate-500">
            Proactive runway modeling comparing on-hand reserve stock against consumption burn rates and replenishment ETAs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={shortageFilter}
              onChange={(e) => setShortageFilter(e.target.checked)}
              className="rounded text-sky-600"
            />
            <span>Shortages Only</span>
          </label>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate Runways</span>
          </button>
        </div>
      </div>

      {/* Grid of Hospital Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const pctSafety = Math.min(100, Math.round((item.current_stock / item.safety_stock) * 100));
          const isDeficit = item.current_stock < item.safety_stock;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border bg-white shadow-xs space-y-4 transition ${
                item.is_shortage_predicted
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.medicine_name}</h3>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-400" /> {item.facility_name}
                  </span>
                </div>
                {item.is_shortage_predicted ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                    SHORTAGE WARNING
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    BUFFER HEALTHY
                  </span>
                )}
              </div>

              {/* On-hand vs Safety progress */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">On-Hand Stock</span>
                  <span className="font-mono font-bold text-slate-900">
                    {item.current_stock} / {item.safety_stock} units
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isDeficit ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pctSafety}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Safety Coverage: {pctSafety}%</span>
                  <span>Safety Threshold: {item.safety_stock}</span>
                </div>
              </div>

              {/* Consumption & Runway */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">Burn Rate</span>
                  <span className="font-bold text-slate-800">{item.average_hourly_consumption} u/hr</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Estimated Runway</span>
                  <span
                    className={`font-bold ${
                      item.estimated_hours_remaining < 12 ? 'text-rose-600' : 'text-slate-800'
                    }`}
                  >
                    {item.estimated_hours_remaining} hrs
                  </span>
                </div>
              </div>

              {/* Replenishment Context */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Inbound Order: <strong>+{item.incoming_replenishment_quantity} units</strong></span>
                {item.expected_replenishment_time && (
                  <span className="font-mono text-slate-600">
                    ETA: {new Date(item.expected_replenishment_time).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
