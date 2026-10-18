import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';

interface SettingsPageProps {
  onOpenDemoScenario: () => void;
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenDemoScenario,
  onRefreshAll,
}) => {
  const [generatorRunning, setGeneratorRunning] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // IBM Z config simulation state
  const [ibmZEndpoint, setIbmZEndpoint] = useState('https://mock-ibm-z-zos.internal.ibm.com/v1/tx');
  const [correlationPrefix, setCorrelationPrefix] = useState('Z-RESCUE-TX');
  const [timeoutSec, setTimeoutSec] = useState('3.0');

  useEffect(() => {
    api
      .getDemoStatus()
      .then((st) => {
        setGeneratorRunning(st.is_running);
        setGeneratedCount(st.generated_count);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleStartGenerator = async () => {
    setLoadingAction(true);
    try {
      await api.startDemoGenerator();
      setGeneratorRunning(true);
      setActionMsg('Background event generator active.');
    } catch (e: any) {
      setActionMsg(`Error: ${e.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStopGenerator = async () => {
    setLoadingAction(true);
    try {
      const res = await api.stopDemoGenerator();
      setGeneratorRunning(false);
      setGeneratedCount(res.generated_count);
      setActionMsg('Background event generator stopped.');
    } catch (e: any) {
      setActionMsg(`Error: ${e.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReset = async () => {
    setLoadingAction(true);
    try {
      await api.resetDemoDatabase();
      setGeneratorRunning(false);
      setActionMsg('Database successfully reset to nominal baseline.');
      onRefreshAll();
    } catch (e: any) {
      setActionMsg(`Error: ${e.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-sky-600" />
          Settings & Hackathon Demonstration Controls
        </h2>
        <p className="text-xs text-slate-500">
          Control real-time event simulation, reset baseline data, and inspect enterprise IBM Z transaction adapter parameters.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-slate-900 text-teal-300 rounded-lg text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Demo Event Generator Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-sky-600" />
              Automated Demo Event Stream Generator
            </h3>
            <p className="text-xs text-slate-500">
              Generates realistic weather anomalies, transit delays, and stock decreases at controlled intervals.
            </p>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              generatorRunning
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {generatorRunning ? 'GENERATOR ACTIVE' : 'STOPPED'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Total Simulated Events Generated:</span>
            <span className="text-xl font-bold text-slate-900">{generatedCount} events</span>
          </div>

          <div className="flex items-center gap-2">
            {!generatorRunning ? (
              <button
                onClick={handleStartGenerator}
                disabled={loadingAction}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStopGenerator}
                disabled={loadingAction}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Pause Stream</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hackathon Demonstration Scenario Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Interactive Insulin Supply-Chain Demo Scenario
            </h3>
            <p className="text-xs text-slate-500">
              Step-by-step presentation scenario demonstrating real-time risk escalation and actionable recommendations.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Walks through the complete event lifecycle: heavy monsoon rainfall → shipment delay → destination stock drop → critical alert creation → explainable recommendations.
        </p>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            disabled={loadingAction}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Baseline</span>
          </button>

          <button
            onClick={onOpenDemoScenario}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Open Scenario Stepper Modal</span>
          </button>
        </div>
      </div>

      {/* IBM Z Enterprise Transaction Adapter Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-4 h-4 text-sky-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              IBM Z Integration Adapter Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Enterprise adapter boundary implementing the TransactionProcessor contract for z/OS Connect EE.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Target Endpoint</label>
            <input
              type="text"
              value={ibmZEndpoint}
              onChange={(e) => setIbmZEndpoint(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Correlation Prefix</label>
            <input
              type="text"
              value={correlationPrefix}
              onChange={(e) => setCorrelationPrefix(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Timeout (Seconds)</label>
            <input
              type="text"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <strong>Honest Architectural Disclosure:</strong> The system is currently running in <strong>Demo Mode</strong> via the high-throughput local transaction engine. When connected to an active IBM Z host (z/OS Connect EE / CICS), all transaction calls route with correlation IDs and sub-second SLAs.
        </div>
      </div>
    </div>
  );
};
