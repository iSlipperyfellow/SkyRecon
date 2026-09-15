import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Crosshair, Settings } from 'lucide-react';

interface BoundingBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
    color: string;
}

// Tactical HUD Components
const CornerBrackets = () => (
    <>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
    </>
);

const TelemetryOverlay = () => (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        {/* Pitch Ladder */}
        <div className="flex flex-col space-y-8 items-center">
            {[20, 10, 0, -10, -20].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                    <div className="w-12 h-[1px] bg-white" />
                    <span className="text-[10px] font-mono text-white">{val}</span>
                    <div className="w-12 h-[1px] bg-white" />
                </div>
            ))}
        </div>
        {/* Horizontal Line */}
        <div className="absolute w-2/3 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
);

export default function LiveFeed() {
    const [boxes, setBoxes] = useState<BoundingBox[]>([]);
    const [fps, setFps] = useState(0);
    const [objectCount, setObjectCount] = useState(0);
    const [isOverride, setIsOverride] = useState(false);
    const [currentFrame, setCurrentFrame] = useState<string | null>(null);
    const [status, setStatus] = useState('connecting');
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [detectionLog, setDetectionLog] = useState<Array<BoundingBox & { timestamp: string }>>([]);

    // Handle Hydration / Time
    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // WebSocket Connection for Real Feed
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to the inference server (port 8000)
        const socket = new WebSocket(`${protocol}//${window.location.hostname}:8000/ws/inference/`);

        socket.onopen = () => {
            console.log('Connected to Live Feed');
            setStatus('connected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'live_update') {
                setCurrentFrame(`data:image/jpeg;base64,${data.frame}`);
                
                const mappedBoxes = data.detections.map((det: any, index: number) => {
                    const [x1, y1, x2, y2] = det.bbox;
                    const width = x2 - x1;
                    const height = y2 - y1;
                    
                    // Map to 100% based on simulator resolution (1280x720)
                    const xPercent = (x1 / 12.8); 
                    const yPercent = (y1 / 7.2);
                    const wPercent = (width / 12.8);
                    const hPercent = (height / 7.2);

                    const colors: Record<string, string> = {
                        'Metal': '#ef4444',
                        'Plastic': '#f59e0b',
                        'Organic': '#10b981',
                        'Other': '#3b82f6'
                    };

                    return {
                        id: `det-${index}`,
                        x: xPercent,
                        y: yPercent,
                        width: wPercent,
                        height: hPercent,
                        label: det.class,
                        confidence: det.confidence,
                        color: colors[det.class] || '#ffffff'
                    };
                });

                setBoxes(mappedBoxes);
                setObjectCount(mappedBoxes.length);
                // Accumulate real detection history (keep last 50)
                if (mappedBoxes.length > 0) {
                    const ts = new Date().toLocaleTimeString();
                    setDetectionLog(prev => [
                        ...mappedBoxes.map(b => ({ ...b, timestamp: ts })),
                        ...prev
                    ].slice(0, 50));
                }
            }
        };

        socket.onclose = () => {
            console.log('Live Feed Disconnected');
            setStatus('disconnected');
        };

        return () => socket.close();
    }, []);

    if (!mounted) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Live Detection Feed</h1>
                        <p className="text-textMuted">Camera ID: CAM-RUNWAY-09L</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsOverride(!isOverride)}
                            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${isOverride ? 'bg-danger text-white animate-pulse' : 'bg-surface border border-white/10 text-white hover:bg-white/5'
                                }`}
                        >
                            {isOverride ? 'MANUAL OVERRIDE ACTIVE' : 'ENABLE OVERRIDE'}
                        </button>
                        <button className="p-2 bg-surface border border-white/10 rounded-md text-textMuted hover:text-white">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                    {/* Main Feed Area */}
                    <div className="lg:col-span-3 flex flex-col">
                        <div className="flex-1 bg-black rounded-xl border border-white/10 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                            {/* Scanning Line Animation */}
                            <div className="absolute inset-x-0 h-1 bg-primary/20 shadow-[0_0_15px_rgba(var(--color-primary),0.5)] z-20 animate-scan pointer-events-none" />

                            {/* Real Video Feed */}
                            {currentFrame ? (
                                <img 
                                    src={currentFrame} 
                                    alt="Live Feed" 
                                    className="w-full h-full object-fill"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-textMuted font-mono text-sm tracking-widest uppercase">
                                        {status === 'connecting' ? 'Establishing Connection...' : 'Waiting for Stream...'}
                                    </p>
                                </div>
                            )}

                            {/* Tactical UI Layers */}
                            <CornerBrackets />
                            <TelemetryOverlay />

                            {/* Grid Overlay */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none"
                                style={{
                                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                                    backgroundSize: '80px 80px'
                                }}
                            />

                            {/* Bounding Boxes */}
                            {boxes.map(box => (
                                <div
                                    key={box.id}
                                    className="absolute transition-all duration-150"
                                    style={{
                                        left: `${box.x}%`,
                                        top: `${box.y}%`,
                                        width: `${box.width}%`,
                                        height: `${box.height}%`,
                                    }}
                                >
                                    {/* Corners only for a "Tech" look */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: box.color }} />
                                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: box.color }} />
                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: box.color }} />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: box.color }} />
                                    
                                    {/* Transparent fill */}
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: box.color }} />

                                    <div
                                        className="absolute -top-7 left-0 px-2 py-0.5 text-[10px] font-bold text-white flex items-center space-x-2 whitespace-nowrap rounded skew-x-[-10deg]"
                                        style={{ backgroundColor: box.color }}
                                    >
                                        <span className="uppercase tracking-tighter">{box.label}</span>
                                        <span className="bg-black/20 px-1 rounded">{(box.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}

                            {/* Crosshair Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <Crosshair className="w-48 h-48 text-white" strokeWidth={0.5} />
                            </div>

                            {/* Status Overlay */}
                            <div className="absolute top-6 left-6 flex items-center space-x-3 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                <div className="w-2 h-2 bg-danger rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                                <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Signal: Nominal</span>
                            </div>

                            <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-1">
                                <div className="text-[10px] font-mono text-white/50 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                    COORD: 33.614N / 73.055E
                                </div>
                                <div className="text-[10px] font-mono text-white/50 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                    SYS_TIME: {mounted ? currentTime : '--:--:--'}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Stats Bar */}
                        <div className="mt-4 grid grid-cols-4 gap-4">
                            <div className="glass-panel p-3 flex flex-col items-center justify-center">
                                <span className="text-xs text-textMuted uppercase tracking-wider">FPS</span>
                                <span className="text-xl font-bold text-white font-mono">{fps.toFixed(0)}</span>
                            </div>
                            <div className="glass-panel p-3 flex flex-col items-center justify-center">
                                <span className="text-xs text-textMuted uppercase tracking-wider">Resolution</span>
                                <span className="text-xl font-bold text-white font-mono">4K</span>
                            </div>
                            <div className="glass-panel p-3 flex flex-col items-center justify-center">
                                <span className="text-xs text-textMuted uppercase tracking-wider">Objects</span>
                                <span className="text-xl font-bold text-white font-mono">{objectCount}</span>
                            </div>
                            <div className="glass-panel p-3 flex flex-col items-center justify-center">
                                <span className="text-xs text-textMuted uppercase tracking-wider">Latency</span>
                                <span className="text-xl font-bold text-success font-mono">12ms</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Detection Log */}
                    <div className="lg:col-span-1 glass-panel flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detection Log</h3>
                            <span className="text-xs font-mono text-textMuted">{detectionLog.length} events</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {detectionLog.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-8 h-8 border-2 border-textMuted/30 rounded-full mb-3" />
                                    <p className="text-xs text-textMuted font-mono uppercase tracking-widest">Awaiting Detections</p>
                                </div>
                            ) : (
                                detectionLog.map((entry, i) => (
                                    <div key={`${entry.id}-${i}`} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                                <span className="font-semibold text-white text-sm">{entry.label}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-textMuted">{entry.timestamp}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-textMuted">Confidence</span>
                                            <span className="text-xs font-mono font-bold" style={{ color: entry.color }}>
                                                {(entry.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="mt-2 w-full bg-white/5 rounded-full h-0.5">
                                            <div className="h-0.5 rounded-full" style={{ width: `${entry.confidence * 100}%`, backgroundColor: entry.color }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
