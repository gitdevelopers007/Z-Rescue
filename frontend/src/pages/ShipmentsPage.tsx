import React, { useState } from 'react';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Thermometer,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/StatusBadge';
import { Shipment } from '../types';
import { api } from '../api/client';

interface ShipmentsPageProps {
  shipments: Shipment[];
  onSelectShipment: (id: string) => void;
  onRefresh: () => void;
}

export const ShipmentsPage: React.FC<ShipmentsPageProps> = ({
  shipments,
  onSelectShipment,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New shipment form
  const [newId, setNewId] = useState('');
  const [newMedicine, setNewMedicine] = useState('Morphine Sulfate 10mg/mL');
  const [newCategory, setNewCategory] = useState('Critical Analgesic');
  const [newOrigin, setNewOrigin] = useState('Central Medical Depot');
  const [newDest, setNewDest] = useState('City Trauma Center');
  const [newQty, setNewQty] = useState(250);
  const [newTempSens, setNewTempSens] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = shipments.filter((shp) => {
    if (statusFilter && shp.shipment_status !== statusFilter) return false;
    if (riskFilter && shp.risk_category !== riskFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        shp.id.toLowerCase().includes(q) ||
        shp.medicine_name.toLowerCase().includes(q) ||
        shp.destination.toLowerCase().includes(q) ||
        shp.supplier.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const now = new Date();
      const delivery = new Date(now.getTime() + 3 * 3600 * 1000);
      await api.createShipment({
        id: newId || undefined,
        medicine_name: newMedicine,
        medicine_category: newCategory,
        origin: newOrigin,
        destination: newDest,
        current_location_name: newOrigin,
        dispatch_time: now.toISOString(),
        expected_delivery_time: delivery.toISOString(),
        current_estimated_delivery_time: delivery.toISOString(),
        required_quantity: Number(newQty),
        available_destination_inventory: 35,
        safety_stock_threshold: 50,
        supplier: 'AeroMed Lifeline Supplies',
        temperature_sensitive: newTempSens,
        temp_celsius: newTempSens ? 4.0 : 22.0,
      });
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error creating shipment: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-600" />
            Medicine Shipment Fleet Management
          </h2>
          <p className="text-xs text-slate-500">
            Real-time tracking of cold-chain, critical antibiotics, and emergency supplies.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Shipment</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, medicine, facility, supplier..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-sky-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="DELAYED">DELAYED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Risk Tiers</option>
            <option value="Low">Low Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Shipment ID</th>
                <th className="px-4 py-3">Medicine & Category</th>
                <th className="px-4 py-3">Current Location</th>
                <th className="px-4 py-3">Destination Facility</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delay</th>
                <th className="px-4 py-3">Cold-Chain</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filtered.map((shp) => (
                <tr
                  key={shp.id}
                  onClick={() => onSelectShipment(shp.id)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{shp.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{shp.medicine_name}</div>
                    <div className="text-[11px] text-slate-500">{shp.medicine_category}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{shp.current_location_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{shp.destination}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={shp.shipment_status} />
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {shp.delay_minutes > 0 ? (
                      <span className="text-amber-700 font-semibold">+{shp.delay_minutes}m</span>
                    ) : (
                      <span className="text-emerald-700">0m</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {shp.temperature_sensitive ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        <Thermometer className="w-3 h-3" />
                        {shp.temp_celsius}°C
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Ambient</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge category={shp.risk_category} score={shp.current_disruption_risk} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:text-sky-800">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Register New Essential Medicine Shipment</h3>
            <form onSubmit={handleCreateShipment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Shipment ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty (e.g. SHP-807)"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={newMedicine}
                  onChange={(e) => setNewMedicine(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Origin Hub</label>
                  <input
                    type="text"
                    required
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Destination Facility</label>
                  <input
                    type="text"
                    required
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tempSens"
                  checked={newTempSens}
                  onChange={(e) => setNewTempSens(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <label htmlFor="tempSens" className="font-semibold text-slate-700 cursor-pointer">
                  Cold-Chain Sensitive (Requires 2°C - 8°C thermal monitoring)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  {isCreating ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
