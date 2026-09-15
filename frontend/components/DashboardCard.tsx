import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface DashboardCardProps {
    title: string;
    subtext: string;
    href: string;
    status?: 'active' | 'warning' | 'critical' | 'inactive';
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

export default function DashboardCard({
    title,
    subtext,
    href,
    status = 'active',
    icon,
    children
}: DashboardCardProps) {
    const statusColors = {
        active: 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        warning: 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]',
        critical: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        inactive: 'bg-secondary',
    };

    return (
        <Link href={href} className="block h-full outline-none">
            <div className="glass-card flex flex-col h-full relative group overflow-hidden border border-white/5 hover:border-white/20 active:scale-[0.98] transition-all duration-200 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
                        <h3 className="text-lg font-semibold text-white tracking-wide group-hover:text-primary transition-colors">{title}</h3>
                    </div>
                    <div className={`text-textMuted group-hover:text-white transition-colors duration-300 relative z-10`}>
                        {icon}
                        {/* Icon neon glow on hover based on status */}
                        <div className={`absolute inset-0 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${status === 'warning' ? 'bg-warning' : status === 'critical' ? 'bg-danger' : 'bg-primary'}`} style={{ mixBlendMode: 'screen' }} />
                    </div>
                </div>

                <div className="flex-1 mb-6 text-textMuted text-sm leading-relaxed relative z-10">
                    {children || <p>{subtext}</p>}
                </div>

                <div className="mt-auto flex items-center text-sm font-medium text-textMuted group-hover:text-white transition-colors">
                    Open Module
                    <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Ambient corner glow syncs with status */}
                <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-all duration-500 pointer-events-none ${status === 'warning' ? 'bg-warning' : status === 'critical' ? 'bg-danger' : 'bg-primary'}`} />
            </div>
        </Link>
    );
}
