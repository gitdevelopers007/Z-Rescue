import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { SeverityBadge } from '../components/StatusBadge';
import { AlertItem } from '../types';
import { api } from '../api/client';

interface AlertsPageProps {
  alerts: AlertItem[];
  onRefresh: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = alerts.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (severityFilter && a.severity !== severityFilter) return false;
    return true;
  });

  const handleAcknowledge = async (id: string) => {
    setUpdatingId(id);
    try {
      await api.updateAlertStatus(id, 'ACKNOWLEDGED', 'Duty Dispatch Coordinator');
      onRefresh();
    } catch (e: any) {
      alert(`Error acknowledging alert: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setUpdatingId(id);
    try {
      await api.updateAlertStatus(id, 'RESOLVED', 'Duty Dispatch Coordinator');
      onRefresh();
    } catch (e: any) {
      alert(`Error resolving alert: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Early Warning & Alert Incident Center
          </h2>
          <p className="text-xs text-slate-500">
            Automated anomaly detection alerts triggered by risk score breaches, weather squalls, or inventory deficit.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Incidents:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New (Unreviewed)</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <span className="text-slate-500 font-mono">
          Showing {filtered.length} active alerts
        </span>
      </div>

      {/* Alerts Grid / List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No alerts match the selected filter criteria.
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border bg-white shadow-xs transition space-y-3 ${
                alert.status === 'NEW'
                  ? alert.severity === 'CRITICAL'
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={alert.severity} />
                  <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                  <span className="font-mono text-[11px] text-slate-400">({alert.id})</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.status === 'NEW'
                        ? 'bg-rose-100 text-rose-800'
                        : alert.status === 'ACKNOWLEDGED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-700 leading-relaxed">{alert.explanation}</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                  <span className="font-bold text-slate-900 block mb-0.5">Suggested Action:</span>
                  {alert.suggested_action}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-500 font-mono">
                  {alert.acknowledged_by && (
                    <span>Ack by {alert.acknowledged_by} at {new Date(alert.acknowledged_at!).toLocaleTimeString()} | </span>
                  )}
                  {alert.resolved_by && (
                    <span className="text-emerald-700 font-semibold">Resolved by {alert.resolved_by}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'NEW' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={updatingId === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={updatingId === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve Alert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
