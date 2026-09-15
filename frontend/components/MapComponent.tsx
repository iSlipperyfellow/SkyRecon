// @ts-nocheck
import { useEffect, useRef } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDroneIcon, getDetectionIcon, createPopupContent } from '@/lib/map-utils';
import * as turf from '@turf/turf';

interface Drone {
  id: string;
  identifier: string;
  home_location?: any;
  recent_telemetry?: any;
}

interface Detection {
  id: string;
  label: string;
  geometry: any;
  hazard_level?: string;
  timestamp: string;
  image_url?: string;
  confidence: number;
  hazard_score?: number;
}

interface MapComponentProps {
  drones: Drone[];
  detections: Detection[];
  selectedDetection?: Detection | null;
  onDetectionClick?: (detection: Detection) => void;
  showHazardGrid?: boolean;
}

export default function MapComponent({
  drones,
  detections,
  selectedDetection,
  onDetectionClick,
  showHazardGrid = false,
}: MapComponentProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Define the precise GPS bounds based on the actual AirSim mission route
  // Top edge is exactly 33.6140 so the zebra crossing (33.6139) is right at the top.
  const airsimBounds: L.LatLngBoundsExpression = [
    [33.6094, 73.0532], // South-West (Bottom-Left)
    [33.6140, 73.0562], // North-East (Top-Right)
  ];

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map and center exactly at the start point (zebra crossing)
      mapRef.current = L.map('map').setView([33.6139, 73.0547], 18);
      console.log('Map initialized with precise bounds version 3');

      // Add a dark basemap for contrast (REMOVED to hide other roads)
      // L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      //   attribution: '© OpenStreetMap contributors, © CARTO',
      //   maxZoom: 19,
      // }).addTo(mapRef.current);

      // Remove the old ImageOverlay:
      // L.imageOverlay('/airsim-map.png?v=3', airsimBounds, {
      //   opacity: 0.9,
      //   interactive: false
      // }).addTo(mapRef.current);

      // --- CUSTOM VECTOR MAP (DARK MODE SCHEME) ---
      const roadWidth = 0.00015; // roughly 15 meters on each side
      
      // 1. Asphalt Road Polygon
      L.polygon([
        [33.6094, 73.0547 - roadWidth],
        [33.6142, 73.0547 - roadWidth],
        [33.6142, 73.0547 + roadWidth],
        [33.6094, 73.0547 + roadWidth]
      ], {
        color: '#1e293b', // slate-800 border
        weight: 1,
        fillColor: '#0f172a', // slate-900 fill (darker asphalt)
        fillOpacity: 0.9
      }).addTo(mapRef.current);

      // 2. Yellow Centerline
      L.polyline([
        [33.6094, 73.0547],
        [33.6142, 73.0547]
      ], {
        color: '#eab308', // yellow-500
        weight: 2,
        dashArray: '10, 15',
        opacity: 0.7
      }).addTo(mapRef.current);

      // 3. Zebra Crossing at Start (33.6139)
      L.polyline([
        [33.6139, 73.0547 - roadWidth],
        [33.6139, 73.0547 + roadWidth]
      ], {
        color: '#ffffff',
        weight: 6,
        dashArray: '5, 10',
        opacity: 0.9
      }).addTo(mapRef.current);

      // 4. Roundabout at End (33.6097)
      L.circle([33.6097, 73.0547], {
        color: '#334155', // slate-700
        weight: 2,
        fillColor: '#0f172a',
        fillOpacity: 1,
        radius: 22
      }).addTo(mapRef.current);
      
      // Inner Roundabout Island
      L.circle([33.6097, 73.0547], {
        color: '#475569',
        weight: 1,
        fillColor: '#1e293b',
        fillOpacity: 1,
        radius: 12
      }).addTo(mapRef.current);
    }
  }, []);

  // Update drone markers
  useEffect(() => {
    if (!mapRef.current) return;

    drones.forEach((drone) => {
      const location = drone.recent_telemetry?.location || drone.home_location;
      if (!location) return;

      let lat: number, lng: number;

      if (typeof location === 'string' && location.startsWith('SRID=')) {
        const matches = location.match(/\(([\d\.]+) ([\d\.]+)\)/);
        if (matches) {
          lng = parseFloat(matches[1]);
          lat = parseFloat(matches[2]);
        } else return;
      } else if (location.type === 'Point' && Array.isArray(location.coordinates)) {
        lng = location.coordinates[0];
        lat = location.coordinates[1];
      } else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
        lat = location.lat;
        lng = location.lng;
      } else return;

      const markerId = `drone-${drone.id}`;
      const coords: [number, number] = [lat, lng];

      if (markersRef.current.has(markerId)) {
        const marker = markersRef.current.get(markerId)!;
        marker.setLatLng(coords);
        mapRef.current!.panTo(coords, { animate: true });
      } else {
        const marker = L.marker(coords, { icon: getDroneIcon() })
          .bindPopup(`<strong>${drone.identifier}</strong><br/>Status: ${drone.recent_telemetry?.battery || 'N/A'}%`)
          .addTo(mapRef.current!);
        markersRef.current.set(markerId, marker);
      }
    });
  }, [drones]);

  // Update detection markers and Hazard Grid
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Process Detections for Markers
    const activeCoords: {lat: number, lng: number, score: number}[] = [];

    detections.forEach((detection) => {
      let lat: number, lng: number;
      const geometry = detection.geometry;

      if (typeof geometry === 'string' && geometry.startsWith('SRID=')) {
        const matches = geometry.match(/\(([\d\.]+) ([\d\.]+)\)/);
        if (matches) {
          lng = parseFloat(matches[1]);
          lat = parseFloat(matches[2]);
        } else return;
      } else if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
        lng = geometry.coordinates[0];
        lat = geometry.coordinates[1];
      } else if (typeof geometry.lat === 'number' && typeof geometry.lng === 'number') {
        lat = geometry.lat;
        lng = geometry.lng;
      } else return;

      const score = (detection.hazard_score || 0) * 100;
      activeCoords.push({ lat, lng, score });

      const markerId = `detection-${detection.id}`;
      const coords: [number, number] = [lat, lng];

      if (markersRef.current.has(markerId)) {
        const marker = markersRef.current.get(markerId)!;
        marker.setIcon(getDetectionIcon(detection.hazard_level, detection.hazard_score));
      } else {
        const marker = L.marker(coords, {
          icon: getDetectionIcon(detection.hazard_level, detection.hazard_score),
        })
          .bindPopup(createPopupContent(detection))
          .addTo(mapRef.current!);

        marker.on('click', () => onDetectionClick?.(detection));
        markersRef.current.set(markerId, marker);
      }
    });

    // 2. Draw Turf Grid if showHazardGrid is true
    if (showHazardGrid) {
      if (geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }

      // bbox: [minX, minY, maxX, maxY] (i.e. [minLng, minLat, maxLng, maxLat])
      const bbox = [73.0532, 33.6094, 73.0562, 33.6140];
      const cellSide = 0.015; // 15 meters cell size for tighter grid
      const options = { units: 'kilometers' as const };
      
      const grid = turf.squareGrid(bbox, cellSide, options);

      grid.features.forEach((cell) => {
        let maxScore = 0;
        activeCoords.forEach((det) => {
          const pt = turf.point([det.lng, det.lat]);
          if (turf.booleanPointInPolygon(pt, cell)) {
            if (det.score > maxScore) maxScore = det.score;
          }
        });
        cell.properties = { maxScore };
      });

      geoJsonLayerRef.current = L.geoJSON(grid, {
        style: function (feature) {
          const score = feature?.properties?.maxScore || 0;
          if (score === 0) return { weight: 0, fillOpacity: 0 };
          
          let color = '#22c55e'; // Green (Low)
          if (score > 75) color = '#ef4444'; // Red (Critical)
          else if (score > 40) color = '#eab308'; // Yellow (Medium)
          
          return {
            color: color,
            weight: 1,
            fillOpacity: 0.5,
            fillColor: color,
          };
        }
      }).addTo(mapRef.current);
    } else {
      if (geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
    }

  }, [detections, onDetectionClick, showHazardGrid]);

  // Highlight selected detection
  useEffect(() => {
    markersRef.current.forEach((marker, key) => {
      if (key === `detection-${selectedDetection?.id}`) {
        marker.openPopup();
        if (mapRef.current) {
          mapRef.current.setView(marker.getLatLng(), 20, { animate: true, duration: 1 });
        }
      }
    });
  }, [selectedDetection]);

  return <div id="map" className="w-full h-full" style={{ backgroundColor: '#0f172a' }} />;
}
