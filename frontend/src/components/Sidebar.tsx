import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Truck,
  Eye,
  Activity,
  AlertTriangle,
  Boxes,
  MapPin,
  CheckSquare,
  FileText,
  HeartPulse,
  Sliders,
  Info,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'events'
  | 'shipments'
  | 'shipment-detail'
  | 'risk-analytics'
  | 'alerts'
  | 'inventory'
  | 'route-weather'
  | 'recommendations'
  | 'audit'
  | 'model-health'
  | 'settings'
  | 'about';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  activeAlertsCount: number;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertsCount,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Live Event Stream', icon: Radio },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'shipment-detail', label: 'Shipment Details', icon: Eye },
    { id: 'risk-analytics', label: 'Risk Analytics', icon: Activity },
    { id: 'alerts', label: 'Alerts Center', icon: AlertTriangle, badge: activeAlertsCount },
    { id: 'inventory', label: 'Inventory & Shortage', icon: Boxes },
    { id: 'route-weather', label: 'Route & Weather Monitor', icon: MapPin },
    { id: 'recommendations', label: 'Recommendations', icon: CheckSquare },
    { id: 'audit', label: 'Audit Log', icon: FileText },
    { id: 'model-health', label: 'Model & Data Health', icon: HeartPulse },
    { id: 'settings', label: 'Settings & Generator', icon: Sliders },
    { id: 'about', label: 'About Z-Rescue', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
          Command Center
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          Real-Time Medical Logistics AI
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-300' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Meta */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex justify-between items-center text-slate-400">
          <span>IBM Z Datathon</span>
          <span className="font-mono text-teal-400">SSF2026</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          Decision Support System v1.0
        </div>
      </div>
    </aside>
  );
};
