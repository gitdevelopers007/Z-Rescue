import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shipment } from '../types';

interface LeafletMapProps {
  shipments: Shipment[];
  selectedShipmentId?: string;
  onSelectShipment?: (id: string) => void;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  height = '480px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered around South India medical transit corridor
      const map = L.map(mapContainerRef.current, {
        center: [12.98, 79.15],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    const bounds: [number, number][] = [];

    shipments.forEach((shp) => {
      const isSelected = shp.id === selectedShipmentId;

      // Color coding based on risk
      let markerColor = '#10b981'; // green
      if (shp.risk_category === 'Moderate') markerColor = '#f59e0b';
      else if (shp.risk_category === 'High') markerColor = '#f97316';
      else if (shp.risk_category === 'Critical') markerColor = '#e11d48';

      // Current location marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${markerColor};
            width: ${isSelected ? '28px' : '20px'};
            height: ${isSelected ? '28px' : '20px'};
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
          ">
            ${isSelected ? '★' : ''}
          </div>
        `,
        iconSize: [isSelected ? 28 : 20, isSelected ? 28 : 20],
        iconAnchor: [isSelected ? 14 : 10, isSelected ? 14 : 10],
      });

      const marker = L.marker([shp.current_lat, shp.current_lng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 180px;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${shp.medicine_name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">ID: ${shp.id} | ${shp.medicine_category}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Location:</span>
              <strong>${shp.current_location_name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Risk:</span>
              <strong style="color: ${markerColor}">${shp.risk_category} (${shp.current_disruption_risk}%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Delay:</span>
              <strong>${shp.delay_minutes} mins</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Status:</span>
              <strong>${shp.shipment_status}</strong>
            </div>
          </div>
        `);

      marker.on('click', () => {
        if (onSelectShipment) onSelectShipment(shp.id);
      });

      marker.addTo(layer);
      bounds.push([shp.current_lat, shp.current_lng]);

      // Route line from origin to destination
      const polyline = L.polyline(
        [
          [shp.origin_lat, shp.origin_lng],
          [shp.current_lat, shp.current_lng],
          [shp.destination_lat, shp.destination_lng],
        ],
        {
          color: markerColor,
          weight: isSelected ? 4 : 2,
          dashArray: shp.shipment_status === 'DELAYED' ? '6, 6' : undefined,
          opacity: isSelected ? 0.9 : 0.5,
        }
      ).addTo(layer);

      // Origin circle marker
      L.circleMarker([shp.origin_lat, shp.origin_lng], {
        radius: 4,
        color: '#64748b',
        fillColor: '#94a3b8',
        fillOpacity: 0.8,
      })
        .bindPopup(`<strong>Origin:</strong> ${shp.origin}`)
        .addTo(layer);

      // Destination circle marker
      L.circleMarker([shp.destination_lat, shp.destination_lng], {
        radius: 6,
        color: '#0f172a',
        fillColor: '#38bdf8',
        fillOpacity: 0.9,
      })
        .bindPopup(`<strong>Destination:</strong> ${shp.destination}`)
        .addTo(layer);

      bounds.push([shp.origin_lat, shp.origin_lng]);
      bounds.push([shp.destination_lat, shp.destination_lng]);
    });

    if (bounds.length > 0 && !selectedShipmentId) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [shipments, selectedShipmentId]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs z-10"
      style={{ height }}
    />
  );
};
