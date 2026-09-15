import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import airportData from '@/data/airport-map.json';
import { apiClient } from '@/lib/api';
import { Layers, AlertTriangle, Navigation, Map as MapIcon } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function HazardMap() {
    const [drones, setDrones] = useState([]);
    const [detections, setDetections] = useState([]);
    const [activeTab, setActiveTab] = useState<'hazards' | 'drones'>('hazards');
    const [selectedDetection, setSelectedDetection] = useState<any | null>(null);

    // Focus teleport from Alerts & Notifications
    useEffect(() => {
        const focusId = localStorage.getItem('focusDetectionId');
        if (focusId && detections.length > 0) {
            const detectionToFocus = detections.find((d: any) => d.id === focusId);
            if (detectionToFocus) {
                setSelectedDetection(detectionToFocus);
                localStorage.removeItem('focusDetectionId');
            }
        }
    }, [detections]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dronesRes, detectionsRes] = await Promise.all([
                    apiClient.getDrones(),
                    apiClient.getDetections({ limit: 50 })
                ]);

                const dronesData = dronesRes.data.results?.features || [];
                const mappedDrones = dronesData.map((f: any) => ({
                    id: f.id,
                    ...f.properties,
                    home_location: f.geometry
                })).filter((d: any) => d.identifier === 'SKY-ALPHA-01');

                const detectionsData = detectionsRes.data.features || detectionsRes.data.results?.features || detectionsRes.data.results || detectionsRes.data || [];
                const mappedDetections = (Array.isArray(detectionsData) ? detectionsData : []).map((f: any) => {
                    const props = f.properties || f;
                    const geometry = f.geometry || null;
                    let lat = 33.6139;
                    let lng = 73.0547;
                    if (typeof geometry === 'string' && geometry.startsWith('SRID=')) {
                        const matches = geometry.match(/\(([\d\.]+) ([\d\.]+)\)/);
                        if (matches) {
                            lng = parseFloat(matches[1]);
                            lat = parseFloat(matches[2]);
                        }
                    } else if (geometry && geometry.coordinates) {
                        lng = geometry.coordinates[0];
                        lat = geometry.coordinates[1];
                    } else if (geometry && geometry.lat) {
                        lat = geometry.lat;
                        lng = geometry.lng;
                    }
                    return {
                        id: f.id || props.id,
                        ...props,
                        geometry: { lat, lng }
                    };
                });

                setDrones(mappedDrones);
                setDetections(mappedDetections);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();

        // Establish WebSockets for real-time updates
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        const token = localStorage.getItem('accessToken');
        
        // 1. Detections WebSocket
        const detectionWs = new WebSocket(`${wsUrl}/ws/inference/?token=${token}`);
        detectionWs.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Listen for the live_update broadcast from InferenceConsumer
                if (message.type === 'live_update' && message.detections) {
                    const dets = message.detections;
                    const newDetections = dets.map((det: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        label: det.class,
                        confidence: det.confidence,
                        hazard_score: det.hazard_score,
                        hazard_level: det.severity ? det.severity.toLowerCase() : 'low',
                        geometry: { lat: det.location?.lat || 33.6139, lng: det.location?.lng || 73.0547 }
                    }));

                    if (newDetections.length > 0) {
                        setDetections(prev => {
                            const merged = [...prev];
                            for (const d of newDetections) {
                                // Deduplicate: if an existing detection has the same label and is extremely close, don't add it again
                                if (!merged.some(existing => 
                                    Math.abs(existing.geometry.lat - d.geometry.lat) < 0.0001 &&
                                    Math.abs(existing.geometry.lng - d.geometry.lng) < 0.0001 &&
                                    existing.label === d.label
                                )) {
                                    merged.unshift(d); // add to top
                                }
                            }
                            return merged; // No slicing, keep them permanently visible
                        });
                    }
                }
            } catch (err) {
                console.error("Detection WS error", err);
            }
        };

        // 2. Telemetry WebSocket
        const telemetryWs = new WebSocket(`${wsUrl}/ws/telemetry/?token=${token}`);
        telemetryWs.onopen = () => {
             telemetryWs.send(JSON.stringify({ action: 'subscribe', drone_id: 'SKY-ALPHA-01' }));
        };
        telemetryWs.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'telemetry_update' && message.data) {
                    const data = message.data;
                    setDrones([{
                        id: "SKY-ALPHA-01",
                        identifier: "SKY-ALPHA-01",
                        recent_telemetry: {
                            location: { lat: data.lat, lng: data.lng },
                            battery: data.battery
                        }
                    } as any]);
                }
            } catch (err) {}
        };

        return () => {
            detectionWs.close();
            telemetryWs.close();
        };
    }, []);

    return (
        <Layout>
            <div className="h-full flex flex-col relative">
                {/* Map Container */}
                <div className="absolute inset-0 z-0 bg-slate-900">
                    <MapComponent 
                        drones={drones} 
                        detections={detections} 
                        showHazardGrid={true} 
                        selectedDetection={selectedDetection}
                    />
                </div>

                {/* Overlay UI */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <div className="glass-panel p-4 w-80 pointer-events-auto">
                        <div className="flex items-center space-x-2 mb-1">
                            <MapIcon className="w-5 h-5 text-primary" />
                            <h1 className="text-xl font-bold text-white">Hazard Map</h1>
                        </div>
                        <p className="text-xs text-textMuted mb-4">Real-time geospatial visualization</p>

                        <div className="flex space-x-2 mb-4">
                            <button
                                onClick={() => setActiveTab('hazards')}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${activeTab === 'hazards' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-textMuted hover:bg-white/10'
                                    }`}
                            >
                                Hazards ({detections.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('drones')}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${activeTab === 'drones' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-textMuted hover:bg-white/10'
                                    }`}
                            >
                                Drones ({drones.length})
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {activeTab === 'hazards' ? (
                                <>
                                    {detections.length > 0 ? detections.map((d: any) => (
                                        <div key={d.id} className="p-2 bg-white/5 rounded border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className={`w-4 h-4 ${d.hazard_level === 'critical' ? 'text-danger' :
                                                        d.hazard_level === 'high' ? 'text-warning' : 'text-info'
                                                    }`} />
                                                <span className="text-sm text-white group-hover:text-primary transition-colors">{d.label}</span>
                                            </div>
                                            <span className="text-xs text-textMuted">{(d.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    )) : <div className="text-center py-4 text-textMuted text-xs">No active hazards</div>}
                                    
                                    <div className="pt-2 border-t border-white/10">
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to clear all stored detections from the map and database?')) {
                                                    try {
                                                        await apiClient.clearDetections();
                                                        setDetections([]);
                                                    } catch (e) {
                                                        console.error('Failed to clear detections', e);
                                                        alert('Failed to clear detections');
                                                    }
                                                }
                                            }}
                                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2 px-4 rounded transition-colors text-xs uppercase"
                                        >
                                            Clear All Detections
                                        </button>
                                    </div>
                                </>
                            ) : (
                                drones.length > 0 ? drones.map((d: any) => (
                                    <div key={d.id} className="p-2 bg-white/5 rounded border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                                        <div className="flex items-center space-x-2">
                                            <Navigation className="w-4 h-4 text-success" />
                                            <span className="text-sm text-white group-hover:text-primary transition-colors">{d.identifier}</span>
                                        </div>
                                        <span className="text-xs text-textMuted">{d.status}</span>
                                    </div>
                                )) : <div className="text-center py-4 text-textMuted text-xs">No active drones</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                    <div className="glass-panel p-2 flex space-x-2">
                        <button className="p-2 hover:bg-white/10 rounded text-white transition-colors" title="Layers">
                            <Layers className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
