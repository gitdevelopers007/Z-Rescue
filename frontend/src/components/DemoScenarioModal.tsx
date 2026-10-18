import React, { useState } from 'react';
import {
  X,
  Play,
  CloudRain,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioUpdated: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({
  isOpen,
  onClose,
  onScenarioUpdated,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunStep = async (step: number) => {
    setLoadingStep(step);
    setFeedback(null);
    try {
      const res = await api.triggerScenarioStep(step);
      setActiveStep(step);
      setFeedback(`Step ${step} executed: ${res.title}. Risk: ${res.updated_risk}% (${res.risk_category}).`);
      onScenarioUpdated();
    } catch (e: any) {
      setFeedback(`Execution error: ${e.message}`);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleRunAll = async () => {
    setLoadingStep(99);
    setFeedback('Running full scenario sequence...');
    try {
      await api.runFullScenario();
      setActiveStep(3);
      setFeedback('Full 3-step demonstration scenario completed. Live risk escalated and critical alert raised.');
      onScenarioUpdated();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleReset = async () => {
    setLoadingStep(100);
    try {
      await api.resetDemoDatabase();
      setActiveStep(0);
      setFeedback('System database restored to nominal baseline.');
      onScenarioUpdated();
    } catch (e: any) {
      setFeedback(`Error resetting: ${e.message}`);
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Interactive Demonstration Scenario
              </h2>
              <p className="text-xs text-slate-400">
                Subject: SHP-801 | Insulin Glargine Cold-Chain Crisis Escalation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-950 flex items-start gap-3">
            <span className="font-bold uppercase tracking-wider text-sky-700 bg-sky-200/60 px-1.5 py-0.5 rounded text-[10px] shrink-0">
              Scenario Premise
            </span>
            <p>
              An urgent shipment of <strong>Insulin Glargine 100U/mL (SHP-801)</strong> is in transit to St. Jude Memorial Hospital. Follow its progression as environmental disruption, highway congestion, and sudden ICU demand trigger AI risk recalibration and proactive recommendations.
            </p>
          </div>

          {/* Stepper */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div
              className={`p-4 rounded-xl border transition ${
                activeStep >= 1
                  ? 'bg-amber-50/50 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      activeStep >= 1
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-sky-600" />
                      Heavy Monsoon Rainfall Warning
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      55 mm localized precipitation reported along Vellore corridor.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRunStep(1)}
                  disabled={loadingStep !== null}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
                >
                  {loadingStep === 1 ? 'Injecting...' : 'Trigger Step 1'}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`p-4 rounded-xl border transition ${
                activeStep >= 2
                  ? 'bg-orange-50/50 border-orange-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      activeStep >= 2
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Transit Delay Escalates (+50 mins)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hydroplaning and culvert waterlogging cause severe corridor crawls.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRunStep(2)}
                  disabled={loadingStep !== null}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
                >
                  {loadingStep === 2 ? 'Injecting...' : 'Trigger Step 2'}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-4 rounded-xl border transition ${
                activeStep >= 3
                  ? 'bg-rose-50/50 border-rose-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      activeStep >= 3
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Destination Inventory Depletion (Critical Reserve)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Emergency ICU patient surge drops hospital stock to 10 units (safety threshold: 50).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRunStep(3)}
                  disabled={loadingStep !== null}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
                >
                  {loadingStep === 3 ? 'Injecting...' : 'Trigger Step 3'}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              onClick={handleReset}
              disabled={loadingStep !== null}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline Data</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handleRunAll}
                disabled={loadingStep !== null}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Entire Sequence</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
