import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import {
    Play,
    Pause,
    Square,
    Battery,
    Wifi,
    Navigation,
    Clock,
    MapPin,
    Activity,
    Wind,
    Terminal,
    XCircle
} from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';
import { apiClient } from '@/lib/api';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function MissionControl() {
    const wsRef = useRef<WebSocket | null>(null);
    const [missionStatus, setMissionStatus] = useState<'active' | 'paused' | 'idle'>('idle');
    const [telemetry, setTelemetry] = useState({
        speed: 0.0,
        altitude: 0.0,
        battery: 100,
        signal: 100,
        flightTime: '00:00:00',
        distance: 0.0,
        progress: 0,
        lat: 33.6139,
        lng: 73.0547
    });

    const [selectedSimulator, setSelectedSimulator] = useState('airsim_client.py');
    const [isSimulatorStarting, setIsSimulatorStarting] = useState(false);

    const handleSimulatorCommand = async (action: 'start' | 'stop') => {
        try {
            setIsSimulatorStarting(action === 'start');
            await apiClient.controlSimulator(action, selectedSimulator);
            if (action === 'start') {
                setTimeout(() => setIsSimulatorStarting(false), 2000);
            } else {
                setIsSimulatorStarting(false);
            }
        } catch (error) {
            console.error("Failed to control simulator", error);
            setIsSimulatorStarting(false);
            alert("Failed to send command to Host Agent.");
        }
    };

    // Connect to actual telemetry websocket
    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        const token = localStorage.getItem('accessToken');
        const ws = new WebSocket(`${wsUrl}/ws/telemetry/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => console.log('Connected to real telemetry stream');

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'telemetry_update' && message.data) {
                    const data = message.data;
                    setTelemetry(prev => ({
                        ...prev,
                        speed: data.velocity !== undefined ? data.velocity : prev.speed,
                        altitude: data.altitude !== undefined ? Math.abs(data.altitude) : prev.altitude,
                        battery: data.battery !== undefined ? data.battery : prev.battery,
                        progress: data.progress !== undefined ? data.progress : prev.progress,
                        lat: data.lat !== undefined ? data.lat : prev.lat,
                        lng: data.lng !== undefined ? data.lng : prev.lng,
                        flightTime: data.flightTime || prev.flightTime,
                        distance: data.distance !== undefined ? (data.distance / 1000).toFixed(2) : prev.distance,
                    }));
                }
            } catch (err) {
                console.error("Telemetry parsing error", err);
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, []);

    const sendCommand = async (command: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'command',
                command: command,
                drone_id: 'SKY-ALPHA-01'
            }));
            
            if (command === 'start' || command === 'resume') setMissionStatus('active');
            else if (command === 'pause') setMissionStatus('paused');
            else if (command === 'abort') setMissionStatus('idle');
        } else {
            alert("WebSocket is not connected. Please refresh the page.");
        }
    };



    return (
        <RoleGuard allowedRoles={['ADMIN', 'OPERATOR']}>
            <Layout>
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
                            <p className="text-textMuted">Operation: SKY-ALPHA-01</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="px-4 py-2 bg-surface border border-white/10 rounded-lg flex items-center space-x-3">
                                <span className="text-textMuted text-sm">Signal Strength</span>
                                <div className="flex items-center space-x-1 text-success">
                                    <Wifi className="w-4 h-4" />
                                    <span className="font-mono font-bold">{telemetry.signal}%</span>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-surface border border-white/10 rounded-lg flex items-center space-x-3">
                                <span className="text-textMuted text-sm">Battery</span>
                                <div className={`flex items-center space-x-1 ${telemetry.battery < 20 ? 'text-danger' : 'text-success'}`}>
                                    <Battery className="w-4 h-4" />
                                    <span className="font-mono font-bold">{telemetry.battery.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        {/* Left Panel: Controls & Status */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Simulator Control Card */}
                            <div className="glass-panel p-6 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent"></div>
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Terminal className="w-5 h-5 mr-2 text-primary" />
                                    Host Simulator Control
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-textMuted uppercase tracking-wider mb-2 block">Select Engine</label>
                                        <select 
                                            value={selectedSimulator}
                                            onChange={(e) => setSelectedSimulator(e.target.value)}
                                            className="w-full bg-background/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                        >
                                            <option value="airsim_client.py">AirSim Client (Unreal Engine)</option>
                                            <option value="drone_simulator.py">Drone Simulator (YOLO CV2)</option>
                                        </select>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleSimulatorCommand('start')}
                                            disabled={isSimulatorStarting}
                                            className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center disabled:opacity-50 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Launch
                                        </button>
                                        <button
                                            onClick={() => handleSimulatorCommand('stop')}
                                            className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 hover:border-danger/40 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Stop
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Status Card */}
                            <div className="glass-panel p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-lg font-semibold text-white">Mission Status</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${missionStatus === 'active' ? 'bg-success/20 text-success border border-success/20 animate-pulse' :
                                        missionStatus === 'paused' ? 'bg-warning/20 text-warning border border-warning/20' :
                                            'bg-secondary/20 text-secondary border border-secondary/20'
                                        }`}>
                                        {missionStatus}
                                    </span>
                                </div>

                                {/* Progress Circle (Simplified) */}
                                <div className="flex justify-center mb-8 relative">
                                    <div className="w-48 h-48 rounded-full border-8 border-surfaceHighlight flex items-center justify-center relative">
                                        <div className="text-center">
                                            <span className="block text-4xl font-bold text-white font-mono">{telemetry.progress.toFixed(0)}%</span>
                                            <span className="text-xs text-textMuted uppercase tracking-wider">Completion</span>
                                        </div>
                                        {/* Active Border Overlay (Simulated) */}
                                        <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent border-r-transparent rotate-45" style={{ transform: `rotate(${telemetry.progress * 3.6}deg)` }}></div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => sendCommand(missionStatus === 'paused' ? 'resume' : 'start')}
                                        className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${missionStatus === 'active'
                                            ? 'bg-success text-white shadow-lg shadow-success/20'
                                            : 'bg-surface border border-white/10 text-textMuted hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Play className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold uppercase">{missionStatus === 'paused' ? 'Resume' : 'Start'}</span>
                                    </button>
                                    <button
                                        onClick={() => sendCommand('pause')}
                                        className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${missionStatus === 'paused'
                                            ? 'bg-warning text-white shadow-lg shadow-warning/20'
                                            : 'bg-surface border border-white/10 text-textMuted hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Pause className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold uppercase">Pause</span>
                                    </button>
                                    <button
                                        onClick={() => sendCommand('abort')}
                                        className="p-4 rounded-lg flex flex-col items-center justify-center bg-surface border border-white/10 text-danger hover:bg-danger/10 transition-all"
                                    >
                                        <Square className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold uppercase">Abort</span>
                                    </button>
                                </div>
                            </div>

                            {/* Flight Stats */}
                            <div className="glass-panel p-6">
                                <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-4">Flight Telemetry</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                                        <div className="flex items-center space-x-2 text-textMuted mb-1">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-xs">Speed</span>
                                        </div>
                                        <div className="text-xl font-bold text-white font-mono">{telemetry.speed.toFixed(1)} <span className="text-xs text-textMuted">m/s</span></div>
                                    </div>
                                    <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                                        <div className="flex items-center space-x-2 text-textMuted mb-1">
                                            <Navigation className="w-4 h-4" />
                                            <span className="text-xs">Altitude</span>
                                        </div>
                                        <div className="text-xl font-bold text-white font-mono">{telemetry.altitude.toFixed(1)} <span className="text-xs text-textMuted">m</span></div>
                                    </div>
                                    <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                                        <div className="flex items-center space-x-2 text-textMuted mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs">Flight Time</span>
                                        </div>
                                        <div className="text-xl font-bold text-white font-mono">{telemetry.flightTime}</div>
                                    </div>
                                    <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                                        <div className="flex items-center space-x-2 text-textMuted mb-1">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-xs">Distance</span>
                                        </div>
                                        <div className="text-xl font-bold text-white font-mono">{telemetry.distance} <span className="text-xs text-textMuted">km</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Map/Visualizer */}
                        <div className="lg:col-span-2 glass-panel p-1 relative overflow-hidden flex flex-col">
                            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs text-white font-mono border border-white/10">
                                LIVE TRACKING FEED
                            </div>

                            {/* Live Leaflet Map */}
                            <div className="flex-1 bg-slate-900 relative rounded-lg overflow-hidden">
                                <MapComponent 
                                    drones={[{
                                        id: "SKY-ALPHA-01",
                                        identifier: "SKY-ALPHA-01",
                                        recent_telemetry: {
                                            location: { lat: telemetry.lat, lng: telemetry.lng },
                                            battery: telemetry.battery
                                        }
                                    }]}
                                    detections={[]} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </RoleGuard>
    );
}
