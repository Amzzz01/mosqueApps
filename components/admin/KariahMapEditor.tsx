'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { GeoJSONPolygon } from '@/types/kariah';
import { leafletToGeoJSON, geoJSONToLeaflet } from '@/lib/pointInPolygon';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface KariahMapEditorProps {
  initialBoundaries?: GeoJSONPolygon | null;
  color?: string;
  onBoundariesChange?: (boundaries: GeoJSONPolygon | null) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

export default function KariahMapEditor({
  initialBoundaries,
  color = '#3B82F6',
  onBoundariesChange,
  height = '500px',
  center = [5.4141, 100.3288], // Penang coordinates
  zoom = 13
}: KariahMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
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

      // FeatureGroup to store drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Draw control
      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: {
              color: color,
              fillOpacity: 0.3
            }
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      map.addControl(drawControl);

      // Handle polygon creation
      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        
        // Clear existing layers
        drawnItems.clearLayers();
        
        // Add new layer
        drawnItems.addLayer(layer);

        // Convert to GeoJSON
        const latlngs = layer.getLatLngs()[0];
        const geoJSON = leafletToGeoJSON(latlngs);
        
        onBoundariesChange?.(geoJSON);
      });

      // Handle polygon editing
      map.on(L.Draw.Event.EDITED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          const latlngs = layer.getLatLngs()[0];
          const geoJSON = leafletToGeoJSON(latlngs);
          onBoundariesChange?.(geoJSON);
        });
      });

      // Handle polygon deletion
      map.on(L.Draw.Event.DELETED, () => {
        onBoundariesChange?.(null);
      });

      mapInstanceRef.current = map;
    }

    // Load initial boundaries if provided
    if (initialBoundaries && drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      
      const latlngs = geoJSONToLeaflet(initialBoundaries);
      const polygon = L.polygon(latlngs, {
        color: color,
        fillOpacity: 0.3
      });
      
      drawnItemsRef.current.addLayer(polygon);

      // Fit map to polygon bounds
      if (mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(polygon.getBounds(), {
          padding: [50, 50]
        });
      }
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, initialBoundaries, color, center, zoom, onBoundariesChange]);

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
      <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-semibold mb-1">Arahan:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Klik ikon <strong>polygon</strong> di sebelah kanan untuk mula melukis</li>
          <li>Klik pada peta untuk menambah titik sempadan kawasan</li>
          <li>Klik titik pertama semula untuk tutup polygon</li>
          <li>Gunakan ikon <strong>edit</strong> untuk mengubah sempadan</li>
          <li>Gunakan ikon <strong>delete</strong> untuk memadam kawasan</li>
        </ul>
      </div>
    </div>
  );
}