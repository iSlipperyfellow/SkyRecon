// @ts-nocheck
import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface HazardMapProps {
    airportData: any;
    drones: any[];
    detections: any[];
}

export default function HazardMapComponent({ airportData, drones, detections }: HazardMapProps) {
    return (
        <MapContainer
            // @ts-ignore
            center={[33.612, 73.055]}
            zoom={15}
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {airportData && (
                <GeoJSON
                    data={airportData}
                    style={(feature) => {
                        const type = feature?.properties?.type;
                        return {
                            color: type === 'runway' ? '#3b82f6' : type === 'taxiway' ? '#64748b' : '#1e293b',
                            weight: type === 'runway' ? 2 : 1,
                            fillColor: type === 'runway' ? '#3b82f6' : type === 'building' ? '#1e293b' : 'transparent',
                            fillOpacity: type === 'runway' ? 0.1 : 0.5
                        };
                    }}
                />
            )}

            {drones.map(drone => (
                <Marker
                    key={drone.id}
                    position={[
                        drone.home_location?.coordinates?.[1] || 33.612,
                        drone.home_location?.coordinates?.[0] || 73.055
                    ]}
                    icon={L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center border border-success shadow-[0_0_15px_rgba(16,185,129,0.5)]"><div class="w-2 h-2 bg-success rounded-full"></div></div>`
                    })}
                >
                    <Popup className="glass-popup">
                        <div className="p-2 text-slate-900">
                            <h3 className="font-bold">{drone.identifier}</h3>
                            <p className="text-xs">Battery: {drone.recent_telemetry?.battery}%</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {detections.map(detection => (
                <Marker
                    key={detection.id}
                    position={[
                        detection.geometry?.coordinates?.[1] || 33.612,
                        detection.geometry?.coordinates?.[0] || 73.055
                    ]}
                    icon={L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="w-4 h-4 ${detection.hazard_level === 'critical' ? 'bg-danger' :
                            detection.hazard_level === 'high' ? 'bg-warning' : 'bg-info'
                            } rounded-full border-2 border-white shadow-lg animate-pulse"></div>`
                    })}
                >
                    <Popup>
                        <div className="p-2 text-slate-900">
                            <h3 className="font-bold">{detection.label}</h3>
                            <p className="text-xs uppercase">{detection.hazard_level}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
