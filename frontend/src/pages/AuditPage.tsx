import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { api } from '../api/client';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchAudit = () => {
    setLoading(true);
    api
      .getAuditLogs(150)
      .then((data) => setLogs(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filtered = logs.filter((item) => {
    if (actionFilter && item.action_type !== actionFilter) return false;
    if (entityFilter && item.entity_type !== entityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Immutable Audit Trail & Regulatory Compliance Log
          </h2>
          <p className="text-xs text-slate-500">
            Cryptographically correlated record of every ingested event, model prediction, and human authorization action.
          </p>
        </div>
        <button
          onClick={fetchAudit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Trail:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Actions</option>
            <option value="EVENT_RECEIVED">EVENT_RECEIVED</option>
            <option value="EVENT_REJECTED">EVENT_REJECTED</option>
            <option value="ALERT_CREATED">ALERT_CREATED</option>
            <option value="ALERT_ACKNOWLEDGED">ALERT_ACKNOWLEDGED</option>
            <option value="ALERT_RESOLVED">ALERT_RESOLVED</option>
            <option value="RECOMMENDATION_APPROVED">RECOMMENDATION_APPROVED</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Entities</option>
            <option value="EVENT">EVENT</option>
            <option value="SHIPMENT">SHIPMENT</option>
            <option value="ALERT">ALERT</option>
            <option value="INVENTORY">INVENTORY</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>

        <span className="text-slate-500 font-mono">
          Showing {filtered.length} audit entries
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Audit Details</th>
                <th className="px-4 py-3">Correlation ID</th>
                <th className="px-4 py-3 text-right">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 font-mono transition text-[11px]">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{log.entity_type}</td>
                  <td className="px-4 py-3 text-sky-700 font-bold">{log.entity_id || '-'}</td>
                  <td className="px-4 py-3 text-slate-800 max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[10px]">
                    {log.correlation_id || 'Z-RESCUE-TX'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {log.user_actor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
