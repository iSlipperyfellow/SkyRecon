import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { apiClient } from '../lib/api';
import { 
    AlertTriangle, 
    CheckCircle, 
    Eye, 
    Trash2, 
    Archive,
    CheckSquare,
    Square
} from 'lucide-react';
import { useRouter } from 'next/router';

export default function AlertsNotifications() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [tab, setTab] = useState<'active' | 'archived'>('active');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    const fetchAlerts = async () => {
        try {
            const res = await apiClient.getHazards({ archived: tab === 'archived' ? 'true' : 'false' });
            setAlerts(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch alerts', err);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [tab]);

    // WebSocket listener for live alerts
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/live/`);
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'live_update' && message.detections) {
                    // Refresh alerts if a high/critical detection comes in
                    const hasHighRisk = message.detections.some((d: any) => 
                        ['high', 'critical'].includes(d.severity?.toLowerCase())
                    );
                    if (hasHighRisk && tab === 'active') {
                        fetchAlerts();
                    }
                }
            } catch (err) {
                console.error("WebSocket message error:", err);
            }
        };

        return () => ws.close();
    }, [tab]);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === alerts.length && alerts.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(alerts.map(a => a.id)));
        }
    };

    const handleArchiveSelected = async () => {
        if (selectedIds.size === 0) return;
        try {
            await apiClient.archiveBulkHazards(Array.from(selectedIds));
            setSelectedIds(new Set());
            fetchAlerts();
        } catch (err) {
            console.error('Failed to archive bulk', err);
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await apiClient.archiveHazard(id);
            fetchAlerts();
        } catch (err) {
            console.error('Failed to archive', err);
        }
    };

    const handleResponse = (alert: any) => {
        // Teleport to hazard map and focus on this detection
        if (alert.detection) {
            localStorage.setItem('focusDetectionId', alert.detection.id);
        }
        router.push('/hazard-map');
    };

    const getSeverityColor = (level: string) => {
        const lower = (level || '').toLowerCase();
        if (lower === 'critical' || lower === 'high') return 'text-red-500 border-red-500/30 bg-red-500/10';
        if (lower === 'medium') return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
        return 'text-slate-400 border-slate-700 bg-slate-800/50';
    };

    const getIconColor = (level: string) => {
        const lower = (level || '').toLowerCase();
        if (lower === 'critical' || lower === 'high') return 'text-red-500';
        if (lower === 'medium') return 'text-yellow-500';
        return 'text-slate-400';
    };

    const getTitle = (alert: any) => {
        const label = alert.detection?.properties?.label || 'Unknown';
        if (label.toLowerCase() === 'metal') return 'Metal Fragment Detected';
        if (label.toLowerCase() === 'plastic') return 'Plastic Debris Detected';
        if (label.toLowerCase() === 'organic') return 'Organic Material Risk';
        return `${label.charAt(0).toUpperCase() + label.slice(1)} Object Detected`;
    };

    const getDescription = (alert: any) => {
        const conf = Math.round((alert.detection?.properties?.confidence || 0) * 100);
        const label = alert.detection?.properties?.label || 'object';
        const level = (alert.level || '').toLowerCase();
        if (level === 'high' || level === 'critical') return `High confidence (${conf}%) detection of ${label.toLowerCase()} debris on the pathway. Immediate attention advised.`;
        if (level === 'medium') return `Moderate confidence (${conf}%) detection of ${label.toLowerCase()} material in the sector. Monitor closely.`;
        return `Low confidence (${conf}%) detection. Routine sweep recommended.`;
    };

    return (
        <Layout>
            <Head>
                <title>Alerts & Notifications | SkyRecon</title>
            </Head>

            <div className="p-8 max-w-6xl mx-auto text-slate-200">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Alerts & Notifications</h1>
                        <p className="text-slate-400 text-sm">Manage system alerts and hazard notifications</p>
                    </div>
                    
                    <div className="flex space-x-3">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center space-x-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-md transition-colors text-sm font-medium"
                        >
                            {selectedIds.size > 0 && selectedIds.size === alerts.length ? <CheckSquare size={16} /> : <Square size={16} />}
                            <span>Select All</span>
                        </button>
                        <button 
                            onClick={handleArchiveSelected}
                            className="flex items-center space-x-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                            disabled={selectedIds.size === 0}
                        >
                            <Archive size={16} />
                            <span>Archive Selected</span>
                        </button>
                    </div>
                </div>

                <div className="border-b border-slate-800 mb-6 flex space-x-6">
                    <button 
                        onClick={() => { setTab('active'); setSelectedIds(new Set()); }}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'active' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        Active Alerts
                    </button>
                    <button 
                        onClick={() => { setTab('archived'); setSelectedIds(new Set()); }}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'archived' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        Archived
                    </button>
                </div>

                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border border-slate-800 border-dashed rounded-lg">
                            No {tab} alerts found.
                        </div>
                    ) : (
                        alerts.map(alert => {
                            const isSelected = selectedIds.has(alert.id);
                            const severity = alert.level || 'LOW';
                            
                            return (
                                <div 
                                    key={alert.id} 
                                    onClick={() => toggleSelect(alert.id)}
                                    className={`relative flex items-center justify-between p-5 rounded-lg border cursor-pointer transition-all ${
                                        isSelected 
                                        ? 'bg-[#1e293b] border-blue-500/50' 
                                        : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="pt-1 text-slate-500 hover:text-blue-400 transition-colors">
                                            {isSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                                        </div>
                                        <div className={`mt-0.5 ${getIconColor(severity)}`}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-200 font-semibold mb-1">{getTitle(alert)}</h3>
                                            <p className="text-slate-400 text-sm mb-3">{getDescription(alert)}</p>
                                            <div className="flex items-center space-x-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded border font-semibold ${getSeverityColor(severity)}`}>
                                                    {severity.toUpperCase()}
                                                </span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-500">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4" onClick={e => e.stopPropagation()}>
                                        {tab === 'active' && (
                                            <button 
                                                onClick={() => handleResponse(alert)}
                                                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded flex items-center tracking-wide transition-colors"
                                            >
                                                RESPONSE
                                            </button>
                                        )}
                                        
                                        <div className="flex items-center space-x-2 text-slate-400">
                                            {tab === 'active' && (
                                                <button onClick={() => handleArchive(alert.id)} className="p-1.5 hover:bg-slate-800 hover:text-green-400 rounded transition-colors" title="Acknowledge & Archive">
                                                    <Archive size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => handleResponse(alert)} className="p-1.5 hover:bg-slate-800 hover:text-blue-400 rounded transition-colors" title="View on Map">
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Layout>
    );
}
