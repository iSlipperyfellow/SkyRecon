import React from 'react';
import { AlertTriangle, CheckCircle, Archive, Eye, Siren } from 'lucide-react';

export interface Alert {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
    status: 'active' | 'archived';
    description: string;
}

interface AlertCardProps {
    alert: Alert;
    onAcknowledge: (id: string) => void;
    onArchive: (id: string) => void;
    onView: (id: string) => void;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
}

export default function AlertCard({ alert, onAcknowledge, onArchive, onView, isSelected, onToggleSelection }: AlertCardProps) {
    const severityStyles = {
        critical: 'border-l-4 border-l-danger bg-danger/5 hover:bg-danger/10',
        high: 'border-l-4 border-l-warning bg-warning/5 hover:bg-warning/10',
        medium: 'border-l-4 border-l-secondary bg-secondary/5 hover:bg-secondary/10',
        low: 'border-l-4 border-l-info bg-info/5 hover:bg-info/10',
    };

    const iconColors = {
        critical: 'text-danger',
        high: 'text-warning',
        medium: 'text-secondary',
        low: 'text-info',
    };

    return (
        <div className={`glass-card mb-3 p-4 ${severityStyles[alert.severity]} transition-all duration-200 hover:translate-x-1 flex items-center space-x-4`}>
            {onToggleSelection && (
                <div className="flex-shrink-0">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(alert.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                    />
                </div>
            )}
            <div className="flex-1 flex justify-between items-start">
                <div className="flex items-start space-x-4">
                    <div className={`mt-1 ${iconColors[alert.severity]}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">{alert.title}</h3>
                        <p className="text-sm text-textMuted mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-textMuted">
                            <span className={`uppercase font-bold tracking-wider ${iconColors[alert.severity]}`}>{alert.severity}</span>
                            <span>•</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {alert.severity === 'critical' && (
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-danger hover:bg-red-600 text-white text-xs font-bold rounded shadow-lg shadow-danger/20 transition-colors animate-pulse">
                            <Siren className="w-3 h-3" />
                            <span>RESPONSE</span>
                        </button>
                    )}
                    <button onClick={() => onAcknowledge(alert.id)} className="p-2 hover:bg-white/10 rounded-full text-success transition-colors" title="Acknowledge">
                        <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => onView(alert.id)} className="p-2 hover:bg-white/10 rounded-full text-primary transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onArchive(alert.id)} className="p-2 hover:bg-white/10 rounded-full text-textMuted hover:text-white transition-colors" title="Archive">
                        <Archive className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
