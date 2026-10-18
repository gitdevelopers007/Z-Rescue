import React from 'react';
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { SeverityBadge } from '../components/StatusBadge';
import { RecommendationItem } from '../types';

interface RecommendationsPageProps {
  recommendations: RecommendationItem[];
  onApprove: (id: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  recommendations,
  onApprove,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-600" />
            Prioritized Operational Recommendations
          </h2>
          <p className="text-xs text-slate-500">
            Actionable AI decision-support directives. Human-in-the-loop authorization strictly required before execution.
          </p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Responsible AI & Clinical Governance Guarantee</span>
          <p className="text-slate-700 leading-relaxed">
            Z-Rescue operates as an intelligent advisory system. Under no circumstances does the engine autonomously reroute public delivery vehicles, override physician prescriptions, or deplete emergency medical reserves without human verification.
          </p>
        </div>
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No active recommendations generated at this time.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-5 rounded-xl border bg-white shadow-xs space-y-3 transition ${
                rec.is_approved
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={rec.priority} />
                  <h3 className="text-sm font-bold text-slate-900">{rec.proposed_action}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">
                    {new Date(rec.created_at).toLocaleTimeString()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    Target: {rec.shipment_id || 'Global Reserve'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Underlying Reason:</span>
                  <p className="text-slate-600 leading-relaxed">{rec.reason}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 space-y-1">
                  <div>
                    <span className="font-bold text-slate-900">Supporting Evidence: </span>
                    <span className="text-slate-600">{rec.supporting_evidence}</span>
                  </div>
                  <div>
                    <span className="font-bold text-teal-800">Projected Operational Benefit: </span>
                    <span className="text-slate-800">{rec.expected_operational_benefit}</span>
                  </div>
                </div>
              </div>

              {/* Action authorization */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 italic">
                  Requires Certified Human Authorization
                </span>

                {rec.is_approved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Authorized & Logged in Audit Trail
                  </span>
                ) : (
                  <button
                    onClick={() => onApprove(rec.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Authorize Recommendation</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
