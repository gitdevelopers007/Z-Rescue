import React from 'react';
import {
  ShieldAlert,
  Play,
  RotateCcw,
  Cpu,
  Radio,
  Server,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  systemMode?: string;
  isDemoMode?: boolean;
  processorName?: string;
  onOpenDemoScenario: () => void;
  onResetData: () => void;
  isLiveConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemMode = 'demo',
  isDemoMode = true,
  processorName = 'Local Demo Processor — IBM Z integration adapter ready',
  onOpenDemoScenario,
  onResetData,
  isLiveConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-sm border border-slate-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Z-Rescue
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                UNI MIND | IBM Z Datathon 2026
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                SSF2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Predict Early. Respond Faster. Protect Essential Supplies.
            </p>
          </div>
        </div>

        {/* Center: IBM Z Adapter / Mode indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Cpu className="w-4 h-4 text-sky-600" />
          <span className="font-medium text-slate-700">{processorName}</span>
        </div>

        {/* Right: Mode Badge & Interactive Demo Launcher */}
        <div className="flex items-center gap-3">
          {/* Live WS connection status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-600 text-[11px]">
              {isLiveConnected ? 'Live Telemetry' : 'Connecting...'}
            </span>
          </div>

          {/* Mode Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDemoMode
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
            title={
              isDemoMode
                ? 'System running in local simulation mode. Real-time inference ready.'
                : 'Connected to external IBM Z host environment.'
            }
          >
            <Server className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Demo Mode' : 'Connected Mode'}</span>
          </div>

          {/* Reset Baseline Button */}
          <button
            onClick={onResetData}
            title="Reset database to initial seed baseline"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Interactive Demo Scenario Button */}
          <button
            onClick={onOpenDemoScenario}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Run Demo Scenario</span>
          </button>
        </div>
      </div>
    </header>
  );
};
