import React from 'react';
import {
  Truck,
  AlertOctagon,
  ShieldAlert,
  Activity,
  Boxes,
  BellRing,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge, StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { BarChart, DonutChart } from '../components/Charts';
import {
  DashboardSummary,
  Shipment,
  EventItem,
  AlertItem,
  RecommendationItem,
} from '../types';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  shipments: Shipment[];
  events: EventItem[];
  alerts: AlertItem[];
  recommendations: RecommendationItem[];
  onSelectShipment: (id: string) => void;
  onNavigate: (page: any) => void;
  onRefresh: () => void;
  onApproveRecommendation: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  shipments,
  events,
  alerts,
  recommendations,
  onSelectShipment,
  onNavigate,
  onRefresh,
  onApproveRecommendation,
}) => {
  const topPriorityShipments = [...shipments]
    .sort((a, b) => b.current_disruption_risk - a.current_disruption_risk)
    .slice(0, 5);

  const riskChartData = summary
    ? [
        { label: 'Low', count: summary.risk_distribution.Low || 0, color: '#10b981' },
        { label: 'Moderate', count: summary.risk_distribution.Moderate || 0, color: '#f59e0b' },
        { label: 'High', count: summary.risk_distribution.High || 0, color: '#f97316' },
        { label: 'Critical', count: summary.risk_distribution.Critical || 0, color: '#e11d48' },
      ]
    : [];

  const statusChartData = summary
    ? [
        { label: 'In Transit', value: summary.shipment_status_distribution.IN_TRANSIT || 0, color: 'bg-sky-500' },
        { label: 'Delayed', value: summary.shipment_status_distribution.DELAYED || 0, color: 'bg-amber-500' },
        { label: 'Dispatched', value: summary.shipment_status_distribution.DISPATCHED || 0, color: 'bg-indigo-500' },
        { label: 'Delivered', value: summary.shipment_status_distribution.DELIVERED || 0, color: 'bg-emerald-500' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Supply-Chain Intelligence
          </h2>
          <p className="text-xs text-slate-500">
            Real-time inference pipeline continuously tracking essential medical logistics corridors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Updated: {summary ? new Date(summary.last_refresh_timestamp).toLocaleTimeString() : '...'}
          </span>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Active Shipments"
          value={summary?.total_active_shipments ?? 0}
          subtitle="Monitored in transit"
          icon={Truck}
          variant="info"
        />
        <MetricCard
          title="High / Critical Risk"
          value={(summary?.high_risk_shipments ?? 0) + (summary?.critical_risk_shipments ?? 0)}
          subtitle="Predicted disruption risk"
          icon={AlertOctagon}
          variant="danger"
        />
        <MetricCard
          title="Critical Medicine Alerts"
          value={summary?.critical_medicine_stock_alerts ?? 0}
          subtitle="Facility stockouts predicted"
          icon={Boxes}
          variant="warning"
        />
        <MetricCard
          title="Average Disruption Risk"
          value={`${summary?.average_predicted_disruption_risk ?? 0}%`}
          subtitle="Fleet-wide ML risk index"
          icon={Activity}
          variant="default"
        />
        <MetricCard
          title="Active Alerts"
          value={summary?.active_alerts_count ?? 0}
          subtitle="Awaiting resolution"
          icon={BellRing}
          variant="warning"
        />
        <MetricCard
          title="Actionable Interventions"
          value={summary?.deliveries_requiring_intervention ?? 0}
          subtitle="Human review needed"
          icon={ShieldAlert}
          variant="danger"
        />
      </div>

      {/* Two Chart Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Shipment Risk Categorization</h3>
              <p className="text-xs text-slate-500">Classified using Random Forest Model & Safety Checks</p>
            </div>
            <button
              onClick={() => onNavigate('risk-analytics')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-2">
            <DonutChart data={riskChartData} />
          </div>
        </div>

        {/* Status Breakdown Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transit Status Distribution</h3>
              <p className="text-xs text-slate-500">Live fleet movement status counts</p>
            </div>
            <button
              onClick={() => onNavigate('shipments')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              Shipments <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <BarChart data={statusChartData} height={160} />
        </div>
      </div>

      {/* Highest Priority Shipments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Highest Priority Shipments Requiring Attention</h3>
            <p className="text-xs text-slate-500">Ordered by real-time ML disruption score</p>
          </div>
          <button
            onClick={() => onNavigate('shipments')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            View All Shipments <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Shipment ID</th>
                <th className="px-4 py-3">Essential Medicine</th>
                <th className="px-4 py-3">Destination Facility</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delay</th>
                <th className="px-4 py-3">Disruption Risk</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {topPriorityShipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{shp.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{shp.medicine_name}</div>
                    <div className="text-[11px] text-slate-500">{shp.medicine_category}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{shp.destination}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={shp.shipment_status} />
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {shp.delay_minutes > 0 ? (
                      <span className="text-amber-700 font-semibold">+{shp.delay_minutes}m</span>
                    ) : (
                      <span className="text-emerald-700">On Time</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge category={shp.risk_category} score={shp.current_disruption_risk} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectShipment(shp.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Row: Recent Live Event Stream & Prioritized Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Live Ingested Events</h3>
              <p className="text-xs text-slate-500">Continuous telemetry and alert updates</p>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              Event Stream <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-72">
            {events.slice(0, 5).map((ev) => (
              <div key={ev.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={ev.severity} />
                  <div>
                    <span className="font-semibold text-slate-900">{ev.event_type}</span>
                    <span className="text-slate-500 ml-1.5 font-mono text-[11px]">
                      {ev.shipment_id || ev.source}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prioritized AI Decision Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Prioritized Action Recommendations</h3>
              <p className="text-xs text-slate-500">Evidence-backed decision support (Requires human review)</p>
            </div>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72">
            {recommendations.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/30 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{rec.proposed_action}</span>
                  <SeverityBadge severity={rec.priority} />
                </div>
                <p className="text-xs text-slate-600">{rec.reason}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 italic">Target: {rec.shipment_id || 'Inventory System'}</span>
                  {rec.is_approved ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <button
                      onClick={() => onApproveRecommendation(rec.id)}
                      className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium transition"
                    >
                      Authorize Action
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
