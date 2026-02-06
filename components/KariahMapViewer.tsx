'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Kawasan, Coordinates } from '@/types/kariah';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface KariahMapViewerProps {
  kawasanList: Kawasan[];
  userLocation?: Coordinates | null;
  highlightedKawasanId?: string | null;
  height?: string;
  center?: [number, number];
  zoom?: number;
  showMosqueMarker?: boolean;
}

export default function KariahMapViewer({
  kawasanList,
  userLocation,
  highlightedKawasanId,
  height = '400px',
  center = [5.4141, 100.3288], // Penang coordinates
  zoom = 13,
  showMosqueMarker = true
}: KariahMapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing layers except tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Add mosque marker
    if (showMosqueMarker) {
      const mosqueIcon = L.divIcon({
        className: 'mosque-marker',
        html: `
          <div style="
            background-color: white;
            border: 3px solid #059669;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <span style="font-size: 24px;">🕌</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker(center, { icon: mosqueIcon })
        .addTo(map)
        .bindPopup('<strong>Masjid Al-Falah</strong>');
    }

    // Draw kawasan boundaries
    kawasanList.forEach((kawasan) => {
      if (!kawasan.boundaries || !kawasan.isActive) return;

      const coordinates = kawasan.boundaries.coordinates[0].map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number]
      );

      const isHighlighted = kawasan.id === highlightedKawasanId;

      const polygon = L.polygon(coordinates, {
        color: kawasan.color,
        fillColor: kawasan.color,
        fillOpacity: isHighlighted ? 0.5 : 0.2,
        weight: isHighlighted ? 3 : 2
      }).addTo(map);

      polygon.bindPopup(`
        <div style="padding: 8px;">
          <strong style="color: ${kawasan.color};">${kawasan.name}</strong>
        </div>
      `);

      // Auto-open popup if highlighted
      if (isHighlighted) {
        polygon.openPopup();
      }
    });

    // Add user location marker if provided
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div style="
            background-color: #3B82F6;
            border: 3px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>Lokasi Anda</strong>');

      // Center map on user location
      map.setView([userLocation.lat, userLocation.lng], 14);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    isClient,
    kawasanList,
    userLocation,
    highlightedKawasanId,
    center,
    zoom,
    showMosqueMarker
  ]);

  if (!isClient) {
    return (
      <div
        className="w-full bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-lg border-2 border-gray-300 z-0"
        style={{ height }}
      />
      
      {/* Legend */}
      {kawasanList.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
          <p className="font-semibold text-sm mb-2">Kawasan:</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {kawasanList
              .filter((k) => k.isActive)
              .map((kawasan) => (
                <div key={kawasan.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: kawasan.color }}
                  />
                  <span className="text-xs text-gray-700">{kawasan.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}