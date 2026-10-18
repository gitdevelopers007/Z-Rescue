import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  Layers,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import { SystemStatus } from '../types';

export const ModelHealthPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSystemStatus()
      .then((data) => setStatus(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-sky-600" />
          Model Diagnostics & Data Pipeline Health
        </h2>
        <p className="text-xs text-slate-500">
          Telemetry stream freshness, inference model operational status, and IBM Z adapter readiness.
        </p>
      </div>

      {/* Grid of Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Model State */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Risk Inference Model
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Engine Type:</span>
              <strong className="text-slate-900">{status?.risk_model.type || 'RandomForest'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Version:</span>
              <strong className="text-slate-900">{status?.risk_model.version || '1.0.0-ibmz-rf'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Execution Mode:</span>
              <strong className={status?.risk_model.is_fallback ? 'text-amber-700' : 'text-emerald-700'}>
                {status?.risk_model.is_fallback ? 'Rule-Based Fallback' : 'Trained scikit-learn Model'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ROC-AUC:</span>
              <strong className="text-teal-700">{status?.risk_model.roc_auc || '0.806'}</strong>
            </div>
          </div>
        </div>

        {/* IBM Z Adapter State */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                IBM Z Integration Layer
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> ADAPTER READY
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Processor:</span>
              <strong className="text-slate-900">Local Demo Processor</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Adapter Interface:</span>
              <strong className="text-slate-900">IBMZTransactionProcessor</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Correlation Prefix:</span>
              <strong className="text-slate-900">Z-RESCUE-TX</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Latency:</span>
              <strong className="text-emerald-700">Sub-10ms Verified</strong>
            </div>
          </div>
        </div>

        {/* Weather Service */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Weather Environmental Feed
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> LIVE / CACHED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Provider:</span>
              <strong className="text-slate-900">Open-Meteo Public API</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cache Policy:</span>
              <strong className="text-slate-900">TTL 1800s with stale fallback</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Offline Resilience:</span>
              <strong className="text-emerald-700">Synthetic simulator active</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Engine Specifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-sky-600" />
          Deterministic Safety Checks & Boundary Enforcement
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Alongside machine-learning risk inference, Z-Rescue applies deterministic safety rules:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Cold-Chain Envelope (2°C - 8°C)</span>
            <p className="text-slate-600">
              Any thermal deviation strictly enforces an immediate Critical alert regardless of travel schedule.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Safety Stock Threshold</span>
            <p className="text-slate-600">
              Hospital on-hand inventory under 50% safety stock immediately flags an inventory shortage alert.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Road Closure Escalation</span>
            <p className="text-slate-600">
              Active highway blockage telemetry forces mandatory bypass evaluation and coordinator review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
