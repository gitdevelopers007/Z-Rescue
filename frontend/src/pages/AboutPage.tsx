import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Layers,
  HeartHandshake,
  CheckCircle,
  AlertTriangle,
  Award,
  Terminal,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Card */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-xs font-mono uppercase tracking-wider">
            IBM Z Datathon 2026 | Official Entry
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs">
            Event Code: SSF2026
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-teal-400" />
          Z-Rescue
        </h1>

        <p className="text-base text-teal-200 font-medium max-w-2xl">
          Predict Early. Respond Faster. Protect Essential Supplies.
        </p>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Z-Rescue is a real-time transactional AI decision-support platform engineered for critical healthcare logistics. By continuously correlating highway traffic blockages, severe weather squalls, inventory burn rates, and cold-chain temperature telemetry, Z-Rescue predicts delivery disruptions hours before medical shortages materialize—empowering supply coordinators to intervene proactively.
        </p>

        <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-6 text-xs font-mono text-slate-400">
          <div>Team: <strong className="text-white">UNI MIND</strong></div>
          <div>Theme: <strong className="text-teal-300">Real-Time AI for Critical Decisions</strong></div>
          <div>Category: <strong className="text-white">AI for Good & Supply-Chain Resilience</strong></div>
        </div>
      </div>

      {/* Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            The Problem Statement
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Severe monsoon weather, sudden road closures, transit bottlenecks, and unexpected spikes in hospital patient intake frequently interrupt life-saving medical supply deliveries (insulin, epinephrine, packed blood, antivenoms). Today, hospital trauma units and regional pharmacies often discover stockouts only after delivery trucks fail to arrive—leaving critically ill patients vulnerable.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            The Z-Rescue Solution
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Z-Rescue bridges high-throughput transactional processing with explainable supervised AI. It ingests thousands of environmental and telemetry events per second, updates predictive risk scores between 0 and 100, raises automated early warnings, and surfaces human-in-the-loop recommendations before a disruption turns into a clinical emergency.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          Technical Stack & System Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block font-sans">Frontend Tier</span>
            <ul className="text-slate-600 space-y-0.5 text-[11px]">
              <li>• React 19 + TypeScript</li>
              <li>• Vite 8 Build Tool</li>
              <li>• Tailwind CSS v4</li>
              <li>• Leaflet + OpenStreetMap</li>
              <li>• Lucide React Icons</li>
              <li>• Native SVG Visualizations</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block font-sans">Backend & Data Pipeline</span>
            <ul className="text-slate-600 space-y-0.5 text-[11px]">
              <li>• Python 3.13 + FastAPI</li>
              <li>• Pydantic v2 Validation</li>
              <li>• SQLAlchemy 2.0 ORM</li>
              <li>• SQLite Transaction Engine</li>
              <li>• WebSockets /ws/events</li>
              <li>• Open-Meteo Integration</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block font-sans">AI & IBM Z Integration</span>
            <ul className="text-slate-600 space-y-0.5 text-[11px]">
              <li>• scikit-learn Random Forest</li>
              <li>• Explainable Risk Factors</li>
              <li>• Rule-Based Safety Engine</li>
              <li>• TransactionProcessor ABC</li>
              <li>• LocalDemo & IBMZ Adapters</li>
              <li>• Time-Aware Feature Pipeline</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Responsible AI & Clinical Governance */}
      <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <HeartHandshake className="w-5 h-5 text-amber-700" />
          Responsible AI & Clinical Governance Mandate
        </div>

        <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
          <p>
            <strong>Decision-Support Prototype:</strong> Z-Rescue is an operational decision-support tool developed for the IBM Z Datathon 2026. It is <em>not</em> a clinically validated diagnostic or prescribing medical device. It does not claim to guarantee medicine availability or replace clinical hospital judgment.
          </p>
          <p>
            <strong>Human-in-the-Loop Safeguards:</strong> Under no conditions does the system autonomously order pharmaceutical inventory, redirect couriers, or dispense medications. Every recommended action requires human verification and authorization.
          </p>
          <p>
            <strong>Privacy Guarantee:</strong> No Protected Health Information (PHI) or identifiable patient records are ingested, processed, or persisted. All telemetry is aggregated at the facility and shipment level.
          </p>
        </div>
      </div>
    </div>
  );
};
