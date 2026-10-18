import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, PageId } from './components/Sidebar';
import { DemoScenarioModal } from './components/DemoScenarioModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { RiskAnalyticsPage } from './pages/RiskAnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { InventoryPage } from './pages/InventoryPage';
import { RouteWeatherPage } from './pages/RouteWeatherPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AuditPage } from './pages/AuditPage';
import { ModelHealthPage } from './pages/ModelHealthPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

import { api, createEventWebSocket } from './api/client';
import {
  Shipment,
  EventItem,
  AlertItem,
  RecommendationItem,
  DashboardSummary,
} from './types';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>('SHP-801');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Core Data State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  // Fetch all live data from backend
  const refreshAll = useCallback(async () => {
    try {
      const [sum, shp, evts, alts, recs] = await Promise.all([
        api.getSummary(),
        api.getShipments(),
        api.getEvents(50),
        api.getAlerts(),
        api.getRecommendations(),
      ]);
      setSummary(sum);
      setShipments(shp);
      setEvents(evts);
      setAlerts(alts);
      setRecommendations(recs);
    } catch (err) {
      console.error('[App] Failed to fetch application state:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();

    // WebSocket real-time subscription
    let ws: WebSocket | null = null;
    try {
      ws = createEventWebSocket((data) => {
        if (data.type === 'NEW_EVENT') {
          // Prepend new event to stream and refresh metrics
          setEvents((prev) => [data.event, ...prev.slice(0, 49)]);
          refreshAll();
        }
      });
      ws.onopen = () => setIsLiveConnected(true);
      ws.onclose = () => setIsLiveConnected(false);
    } catch (e) {
      console.warn('WS Init notice:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [refreshAll]);

  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
    setCurrentPage('shipment-detail');
  };

  const handleApproveRecommendation = async (id: string) => {
    try {
      await api.approveRecommendation(id, 'Supply Coordinator');
      refreshAll();
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset database to clean seed state?')) {
      try {
        await api.resetDemoDatabase();
        await refreshAll();
        setSelectedShipmentId('SHP-801');
      } catch (e: any) {
        alert(`Reset error: ${e.message}`);
      }
    }
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'NEW').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Persistent Enterprise Header */}
      <Header
        systemMode={summary?.system_mode}
        isDemoMode={summary?.is_demo_mode}
        processorName={summary?.processor_name}
        onOpenDemoScenario={() => setIsDemoModalOpen(true)}
        onResetData={handleResetData}
        isLiveConnected={isLiveConnected}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {currentPage === 'dashboard' && (
            <DashboardPage
              summary={summary}
              shipments={shipments}
              events={events}
              alerts={alerts}
              recommendations={recommendations}
              onSelectShipment={handleSelectShipment}
              onNavigate={setCurrentPage}
              onRefresh={refreshAll}
              onApproveRecommendation={handleApproveRecommendation}
            />
          )}

          {currentPage === 'events' && (
            <EventsPage
              events={events}
              shipments={shipments}
              onEventSubmitted={refreshAll}
            />
          )}

          {currentPage === 'shipments' && (
            <ShipmentsPage
              shipments={shipments}
              onSelectShipment={handleSelectShipment}
              onRefresh={refreshAll}
            />
          )}

          {currentPage === 'shipment-detail' && (
            <ShipmentDetailPage
              shipmentId={selectedShipmentId}
              onBack={() => setCurrentPage('shipments')}
              onApproveRecommendation={handleApproveRecommendation}
            />
          )}

          {currentPage === 'risk-analytics' && <RiskAnalyticsPage />}

          {currentPage === 'alerts' && (
            <AlertsPage alerts={alerts} onRefresh={refreshAll} />
          )}

          {currentPage === 'inventory' && <InventoryPage />}

          {currentPage === 'route-weather' && (
            <RouteWeatherPage
              shipments={shipments}
              onSelectShipment={handleSelectShipment}
              onRefresh={refreshAll}
            />
          )}

          {currentPage === 'recommendations' && (
            <RecommendationsPage
              recommendations={recommendations}
              onApprove={handleApproveRecommendation}
            />
          )}

          {currentPage === 'audit' && <AuditPage />}

          {currentPage === 'model-health' && <ModelHealthPage />}

          {currentPage === 'settings' && (
            <SettingsPage
              onOpenDemoScenario={() => setIsDemoModalOpen(true)}
              onRefreshAll={refreshAll}
            />
          )}

          {currentPage === 'about' && <AboutPage />}
        </main>
      </div>

      {/* Interactive Demonstration Scenario Modal */}
      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onScenarioUpdated={refreshAll}
      />
    </div>
  );
};

export default App;
