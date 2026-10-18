import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Sliders,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { RiskBadge } from '../components/StatusBadge';
import { api } from '../api/client';

export const RiskAnalyticsPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Playground state
  const [delayMins, setDelayMins] = useState(35);
  const [weatherSev, setWeatherSev] = useState(0.5);
  const [rainfallMm, setRainfallMm] = useState(30);
  const [roadClosure, setRoadClosure] = useState(false);
  const [invCoverage, setInvCoverage] = useState(0.6);
  const [tempDev, setTempDev] = useState(0.5);
  const [criticality, setCriticality] = useState('HIGH');

  // Prediction output
  const [prediction, setPrediction] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    api
      .getModelInfo()
      .then((data) => {
        setModelInfo(data);
        runInference();
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const runInference = async () => {
    setIsPredicting(true);
    try {
      const res = await api.predictRisk({
        delay_minutes: Number(delayMins),
        weather_severity: Number(weatherSev),
        rainfall_mm: Number(rainfallMm),
        road_closure_reported: roadClosure,
        inventory_coverage_ratio: Number(invCoverage),
        temp_deviation: Number(tempDev),
        medicine_criticality: criticality,
      });
      setPrediction(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsPredicting(false);
    }
  };

  const featureWeights = modelInfo?.metadata?.feature_importances || {
    inventory_coverage_ratio: 0.246,
    road_closure_flag: 0.214,
    delay_ratio: 0.172,
    weather_severity: 0.112,
    temp_deviation_celsius: 0.108,
    rainfall_mm: 0.079,
    travel_progress_ratio: 0.044,
    medicine_criticality_num: 0.025,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-600" />
          AI Risk Analytics & Model Explainability
        </h2>
        <p className="text-xs text-slate-500">
          Supervised machine-learning risk inference model trained for transit disruption scoring.
        </p>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Model Type</span>
          <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
            {modelInfo?.metadata?.model_type || 'RandomForest'}
          </div>
          <span className="text-[10px] text-teal-600 font-semibold">scikit-learn 1.9</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Test Accuracy</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {modelInfo?.metadata?.accuracy ? `${(modelInfo.metadata.accuracy * 100).toFixed(1)}%` : '72.9%'}
          </div>
          <span className="text-[10px] text-slate-400">Balanced class split</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Precision</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {modelInfo?.metadata?.precision ? `${(modelInfo.metadata.precision * 100).toFixed(1)}%` : '61.2%'}
          </div>
          <span className="text-[10px] text-slate-400">Disruption detection</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Recall</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {modelInfo?.metadata?.recall ? `${(modelInfo.metadata.recall * 100).toFixed(1)}%` : '70.8%'}
          </div>
          <span className="text-[10px] text-slate-400">Safety recall priority</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">ROC-AUC Score</span>
          <div className="text-xl font-bold text-teal-700 mt-1 font-mono">
            {modelInfo?.metadata?.roc_auc || '0.806'}
          </div>
          <span className="text-[10px] text-slate-400">Discriminative power</span>
        </div>
      </div>

      {/* Feature Importance Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Feature Importance Distribution</h3>
            <p className="text-xs text-slate-500">MDI (Mean Decrease in Impurity) contribution to predicted risk</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            N = {modelInfo?.metadata?.train_samples || 2250} Training Samples
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {Object.entries(featureWeights).map(([feat, weight]: [string, any]) => {
            const pct = (Number(weight) * 100).toFixed(1);
            return (
              <div key={feat} className="space-y-1">
                <div className="flex justify-between font-mono text-slate-700">
                  <span className="font-semibold">{feat}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Number(weight) * 350)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Risk Playground */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              Interactive Inference & Sensitivity Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Manipulate telemetry features in real time to observe the calibrated risk prediction and action recommendations.
            </p>
          </div>
          <button
            onClick={runInference}
            disabled={isPredicting}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
          >
            {isPredicting ? 'Inferring...' : 'Recalculate Risk'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Controls */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Delay (Minutes): {delayMins}m</span>
                <span className="text-slate-400 font-mono">0 – 180 min</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={delayMins}
                onChange={(e) => {
                  setDelayMins(Number(e.target.value));
                  runInference();
                }}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Weather Severity Index: {weatherSev}</span>
                <span className="text-slate-400 font-mono">0.0 – 1.0</span>
              </div>
              <input
                type="range"
                step="0.05"
                min="0"
                max="1"
                value={weatherSev}
                onChange={(e) => {
                  setWeatherSev(Number(e.target.value));
                  runInference();
                }}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Rainfall Intensity: {rainfallMm} mm</span>
                <span className="text-slate-400 font-mono">0 – 120 mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={rainfallMm}
                onChange={(e) => {
                  setRainfallMm(Number(e.target.value));
                  runInference();
                }}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Destination Inventory Coverage: {(invCoverage * 100).toFixed(0)}%</span>
                <span className="text-slate-400 font-mono">0.1 – 2.0x Safety</span>
              </div>
              <input
                type="range"
                step="0.05"
                min="0.1"
                max="2.0"
                value={invCoverage}
                onChange={(e) => {
                  setInvCoverage(Number(e.target.value));
                  runInference();
                }}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={roadClosure}
                  onChange={(e) => {
                    setRoadClosure(e.target.checked);
                    runInference();
                  }}
                  className="rounded text-sky-600"
                />
                <span>Active Road Closure on Route</span>
              </label>

              <select
                value={criticality}
                onChange={(e) => {
                  setCriticality(e.target.value);
                  runInference();
                }}
                className="rounded border border-slate-300 p-1.5 font-semibold bg-white"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Emergency</option>
              </select>
            </div>
          </div>

          {/* Prediction Results Preview */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Inference Result Output
              </span>
              {prediction && (
                <RiskBadge category={prediction.risk_category} score={prediction.risk_score} size="lg" />
              )}
            </div>

            {prediction ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Prediction Horizon</span>
                  <span className="font-semibold text-white">{prediction.prediction_horizon}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Primary Contributing Factors</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 mt-1">
                    {prediction.contributing_factors.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] font-bold text-teal-300 uppercase block mb-1">
                    Recommended Operational Action
                  </span>
                  <p className="text-white font-medium">{prediction.recommended_action}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Run inference to view calibrated score.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
