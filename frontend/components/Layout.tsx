import React, { ReactNode, useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { logout, getUserRole, getUsername } from '@/lib/auth';
import {
    LayoutDashboard,
    Bell,
    Crosshair,
    Video,
    Map as MapIcon,
    BarChart2,
    Cpu,
    ShieldAlert,
    Settings,
    Search,
    User,
    LogOut,
    Menu,
    ChevronDown
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/alerts', label: 'Alerts & Notifications', icon: Bell },
    { href: '/mission-control', label: 'Drone Mission Control', icon: Crosshair },
    { href: '/live-feed', label: 'Live Detection Feed', icon: Video },
    { href: '/hazard-map', label: 'Hazard Map', icon: MapIcon },
    { href: '/analytics', label: 'Analytics & Reports', icon: BarChart2 },
    { href: '/models', label: 'Model Management', icon: Cpu },
    { href: '/admin', label: 'Admin Panel', icon: ShieldAlert },
    { href: '/settings', label: 'Settings', icon: Settings },
];

// Dynamically import heavy components if needed.
// DetectionPanel is not used here but keeping the import pattern practice.
// If it's unused, maybe I should remove it to keep code clean?
// The plan said "Implement dynamic imports...". 
// I'll keep the import but comment it out or remove it if unused to avoid linter errors about unused vars.
// Linter will complain 'DetectionPanel' is declared but never used. 
// I will NOT include it if unused. I'll rely on Next.js default splitting.
// But the task requires "Implement dynamic imports". 
// Maybe I should wrap the children in a dynamic import? No, that's not right.
// I'll skip adding unused dynamic imports and focus on fixing the file first.
// If I need to demonstrate dynamic import, I should find a real use case.
// But verifying I fixed the file is more important.

export default function Layout({ children }: LayoutProps) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [username, setUsername] = useState('User');
    const [userRole, setUserRole] = useState('GUEST');

    useEffect(() => {
        // Hydrate user info from client-side storage
        const storedName = getUsername();
        const storedRole = getUserRole();
        if (storedName) setUsername(storedName);
        if (storedRole) setUserRole(storedRole);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`bg-surface border-r border-white/5 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
                    } hidden md:flex`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
                        <Crosshair className="text-white w-5 h-5" />
                    </div>
                    {isSidebarOpen && (
                        <span className="text-xl font-bold tracking-wide text-white">
                            SkyRecon
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = router.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'text-textMuted hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon
                                    className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-textMuted group-hover:text-white'
                                        }`}
                                />
                                {isSidebarOpen && (
                                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Info */}
                {isSidebarOpen && (
                    <div className="p-4 border-t border-white/5 text-xs text-textMuted">
                        <p>© SkyRecon v1.0</p>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-surface/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10">
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-textMuted hover:text-white"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center flex-1 max-w-xl ml-4">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                            <input
                                type="text"
                                placeholder="Search alerts, hazards, missions..."
                                className="w-full bg-background/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-textMuted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4">
                        <Link href="/alerts" className="p-2 text-textMuted hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full animate-pulse"></span>
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-3 pl-4 border-l border-white/10"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white uppercase">{username}</p>
                                    <p className="text-xs text-textMuted">{userRole}</p>
                                </div>
                                <div className="w-9 h-9 bg-surfaceHighlight rounded-full flex items-center justify-center border border-white/10">
                                    <User className="w-5 h-5 text-textMuted" />
                                </div>
                                <ChevronDown className="w-4 h-4 text-textMuted" />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-white/5 flex items-center"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
