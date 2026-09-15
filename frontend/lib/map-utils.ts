/**
 * Map utilities for Leaflet
 */

import L from 'leaflet';

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  location: MapCenter;
  hazard_score?: number;
  hazard_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  image_url?: string;
  timestamp: string;
}

export interface Drone {
  id: string;
  identifier: string;
  location: MapCenter;
  status: string;
  battery?: number;
  altitude?: number;
}

export function getDetectionColor(hazardLevel?: string): string {
  const level = hazardLevel ? hazardLevel.toUpperCase() : 'LOW';
  switch (level) {
    case 'HIGH':
      return '#dc2626'; // red-600
    case 'MEDIUM':
      return '#eab308'; // yellow-500
    case 'LOW':
      return '#2563eb'; // blue-600
    default:
      return '#6b7280'; // gray-500
  }
}

export function getDetectionIcon(hazardLevel?: string, hazardScore?: number) {
  const color = getDetectionColor(hazardLevel);
  
  return L.divIcon({
    className: 'detection-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${hazardScore ? hazardScore.toFixed(2) : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function getDroneIcon() {
  return L.divIcon({
    className: 'drone-marker',
    html: `
      <div style="
        background-color: #0ea5e9;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        🚁
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function createPopupContent(detection: Detection): string {
  return `
    <div style="min-width: 200px;">
      <h4 style="margin: 0 0 8px 0; font-weight: bold;">${detection.label.toUpperCase()}</h4>
      <p style="margin: 4px 0;"><strong>Confidence:</strong> ${(detection.confidence * 100).toFixed(1)}%</p>
      ${detection.hazard_score !== undefined ? `
        <p style="margin: 4px 0;"><strong>Hazard Score:</strong> ${detection.hazard_score.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Level:</strong> <span style="color: ${getDetectionColor(detection.hazard_level)};"><strong>${detection.hazard_level}</strong></span></p>
      ` : ''}
      <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date(detection.timestamp).toLocaleTimeString()}</p>
      ${detection.image_url ? `
        <img src="${detection.image_url}" style="width: 100%; margin-top: 8px; border-radius: 4px; max-height: 150px;" alt="Detection" />
      ` : ''}
    </div>
  `;
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}
