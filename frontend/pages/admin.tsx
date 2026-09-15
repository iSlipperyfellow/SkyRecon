import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import RoleGuard from '@/components/auth/RoleGuard';
import { isAuthenticated, getUserRole } from '@/lib/auth';
import { Users, Settings, Shield, Key, Save } from 'lucide-react';

export default function Admin() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('settings');
    const [settings, setSettings] = useState({
        autoAcknowledge: false,
        confidenceThreshold: 0.75,
        patrolInterval: 30,
        maintenanceMode: false
    });

    useEffect(() => {
        // In a real app, we would verify the role here
        // if (!isAuthenticated() || getUserRole() !== 'ADMIN') {
        //   router.push('/dashboard');
        // }
    }, []);

    const handleSave = () => {
        // Mock save
        alert('Settings saved successfully');
    };



    return (
        <RoleGuard allowedRoles={['ADMIN']}>
            <Layout>
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">System Administration</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Tabs */}
                        <div className="lg:col-span-1">
                            <div className="glass-panel p-2 space-y-1">
                                {[
                                    { id: 'settings', label: 'System Settings', icon: Settings },
                                    { id: 'users', label: 'User Management', icon: Users },
                                    { id: 'security', label: 'Security & Access', icon: Shield },
                                    { id: 'api', label: 'API Keys', icon: Key },
                                    { id: 'health', label: 'System Health', icon: Settings },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-textMuted hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            <div className="glass-panel p-8 min-h-[600px]">
                                {activeTab === 'settings' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-4">Detection Configuration</h2>
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                    <div>
                                                        <label className="font-medium text-white block">Auto-Acknowledge Low Risk</label>
                                                        <p className="text-sm text-textMuted">Automatically archive low confidence detections</p>
                                                    </div>
                                                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                                        <input
                                                            type="checkbox"
                                                            className="peer absolute w-12 h-6 opacity-0 cursor-pointer z-10"
                                                            checked={settings.autoAcknowledge}
                                                            onChange={e => setSettings({ ...settings, autoAcknowledge: e.target.checked })}
                                                        />
                                                        <div className={`block w-12 h-6 rounded-full transition-colors ${settings.autoAcknowledge ? 'bg-success' : 'bg-surfaceHighlight'}`}></div>
                                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.autoAcknowledge ? 'translate-x-6' : ''}`}></div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                    <label className="font-medium text-white block mb-2">Confidence Threshold ({Math.round(settings.confidenceThreshold * 100)}%)</label>
                                                    <input
                                                        type="range"
                                                        min="0.5"
                                                        max="0.99"
                                                        step="0.01"
                                                        value={settings.confidenceThreshold}
                                                        onChange={e => setSettings({ ...settings, confidenceThreshold: parseFloat(e.target.value) })}
                                                        className="w-full h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                    <div className="flex justify-between text-xs text-textMuted mt-2">
                                                        <span>Lenient (50%)</span>
                                                        <span>Strict (99%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-4">Drone Operations</h2>
                                            <div className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                <label className="font-medium text-white block mb-2">Patrol Interval (minutes)</label>
                                                <input
                                                    type="number"
                                                    value={settings.patrolInterval}
                                                    onChange={e => setSettings({ ...settings, patrolInterval: parseInt(e.target.value) })}
                                                    className="w-full bg-background border border-white/10 rounded px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/10">
                                            <button onClick={handleSave} className="px-6 py-2 bg-primary text-white hover:bg-blue-600 rounded-lg flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all font-medium">
                                                <Save className="w-4 h-4" />
                                                <span>Save Changes</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'users' && <UsersTab />}
                                {activeTab === 'security' && <SecurityTab />}
                                {activeTab === 'api' && <ApiKeysTab />}
                                {activeTab === 'health' && <HealthTab />}
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </RoleGuard>
    );
}

function UsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { apiClient } = require('@/lib/api');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await apiClient.getUsers();
                setUsers(res.data.results || []);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <div className="text-white">Loading users...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">User Management</h2>
                <button className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 transition text-sm font-medium">
                    + Add New User
                </button>
            </div>
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">User</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Role</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Status</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Joined</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: any) => (
                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{u.username}</div>
                                            <div className="text-xs text-textMuted">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-surfaceHighlight text-white text-xs rounded border border-white/10">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {u.is_active ? (
                                        <span className="text-success text-xs font-bold flex items-center">
                                            <div className="w-1.5 h-1.5 bg-success rounded-full mr-2"></div> ACTIVE
                                        </span>
                                    ) : (
                                        <span className="text-textMuted text-xs font-bold flex items-center">
                                            <div className="w-1.5 h-1.5 bg-textMuted rounded-full mr-2"></div> INACTIVE
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-textMuted">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-primary hover:text-blue-400 text-sm font-medium mr-3">Edit</button>
                                    <button className="text-danger hover:text-red-400 text-sm font-medium">Suspend</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SecurityTab() {
    const [security, setSecurity] = useState({
        twoFactor: true,
        sessionTimeout: 15,
        ipWhitelist: false,
        strictPasswords: true
    });

    const handleSave = () => {
        alert('Security configuration updated successfully.');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Access Control & Security</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                            <label className="font-medium text-white block">Enforce Two-Factor Authentication (2FA)</label>
                            <p className="text-sm text-textMuted">Require all users to use an authenticator app</p>
                        </div>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input type="checkbox" className="peer absolute w-12 h-6 opacity-0 cursor-pointer z-10" checked={security.twoFactor} onChange={e => setSecurity({...security, twoFactor: e.target.checked})} />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${security.twoFactor ? 'bg-success' : 'bg-surfaceHighlight'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${security.twoFactor ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                            <label className="font-medium text-white block">Strict Password Policy</label>
                            <p className="text-sm text-textMuted">Enforce complex passwords with 12+ characters</p>
                        </div>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input type="checkbox" className="peer absolute w-12 h-6 opacity-0 cursor-pointer z-10" checked={security.strictPasswords} onChange={e => setSecurity({...security, strictPasswords: e.target.checked})} />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${security.strictPasswords ? 'bg-success' : 'bg-surfaceHighlight'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${security.strictPasswords ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                            <label className="font-medium text-white block">IP Whitelisting</label>
                            <p className="text-sm text-textMuted">Restrict login access to corporate network IPs</p>
                        </div>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input type="checkbox" className="peer absolute w-12 h-6 opacity-0 cursor-pointer z-10" checked={security.ipWhitelist} onChange={e => setSecurity({...security, ipWhitelist: e.target.checked})} />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${security.ipWhitelist ? 'bg-success' : 'bg-surfaceHighlight'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${security.ipWhitelist ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10">
                <button onClick={handleSave} className="px-6 py-2 bg-primary text-white hover:bg-blue-600 rounded-lg flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all font-medium">
                    <Save className="w-4 h-4" />
                    <span>Save Security Configuration</span>
                </button>
            </div>
        </div>
    );
}

function ApiKeysTab() {
    const [keys, setKeys] = useState([
        { id: 1, name: 'Inference Engine Integration', prefix: 'sk_live_...a8f2', created: '2026-04-10', lastUsed: 'Just now' },
        { id: 2, name: 'Drone Telemetry Relay', prefix: 'sk_live_...b9e1', created: '2026-04-15', lastUsed: '5 mins ago' }
    ]);

    const handleGenerate = () => {
        const newKey = {
            id: Date.now(),
            name: 'New Service Integration',
            prefix: 'sk_live_...' + Math.random().toString(36).substring(2, 6),
            created: 'Today',
            lastUsed: 'Never'
        };
        setKeys([...keys, newKey]);
        alert('API Key generated successfully! (Mocked for safety)');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">API Keys</h2>
                <button onClick={handleGenerate} className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 transition text-sm font-medium">
                    + Generate New Key
                </button>
            </div>
            
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Key Name</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Token Prefix</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Created</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold">Last Used</th>
                            <th className="p-4 text-xs text-textMuted uppercase font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map(k => (
                            <tr key={k.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="p-4 text-white font-medium">{k.name}</td>
                                <td className="p-4 font-mono text-sm text-textMuted">{k.prefix}</td>
                                <td className="p-4 text-sm text-textMuted">{k.created}</td>
                                <td className="p-4 text-sm text-textMuted">{k.lastUsed}</td>
                                <td className="p-4 text-right">
                                    <button className="text-danger hover:text-red-400 text-sm font-medium">Revoke</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
function HealthTab() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { apiClient } = require('@/lib/api');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await apiClient.getHealthMetrics();
                setMetrics(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !metrics) return <div className="text-white">Loading metrics...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    Backend Health Status 
                    <span className="ml-3 px-2 py-1 bg-success/20 text-success text-xs rounded border border-success/20">LIVE</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                        <span className="text-xs text-textMuted uppercase">CPU LOAD</span>
                        <div className="text-2xl font-bold text-white mt-1">{metrics?.infrastructure?.cpu_load || '0%'}</div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-500" style={{ width: metrics?.infrastructure?.cpu_load || '0%' }}></div>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                        <span className="text-xs text-textMuted uppercase">MEMORY</span>
                        <div className="text-2xl font-bold text-white mt-1">{metrics?.infrastructure?.memory_usage || '0%'}</div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: metrics?.infrastructure?.memory_usage || '0%' }}></div>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                        <span className="text-xs text-textMuted uppercase">DISK STATUS</span>
                        <div className="text-2xl font-bold text-white mt-1">{metrics?.infrastructure?.disk_usage || '0%'}</div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: metrics?.infrastructure?.disk_usage || '0%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Service Connectivity</h3>
                <div className="space-y-3">
                    {metrics && Object.entries(metrics.services).map(([service, status]: [string, any]) => (
                        <div key={service} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="capitalize text-white">{service}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                <span className="text-xs text-success font-mono uppercase font-bold">{String(status)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
