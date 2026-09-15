import Layout from '@/components/Layout';
import { User, Bell, Moon, Globe, Shield } from 'lucide-react';

export default function Settings() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Settings</h1>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                            <User className="w-5 h-5 text-primary" />
                            <span>Profile Settings</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-1">Full Name</label>
                                <input type="text" defaultValue="Operator Alpha" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-1">Email Address</label>
                                <input type="email" defaultValue="operator@skyrecon.com" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <span>Preferences</span>
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <Moon className="w-5 h-5 text-textMuted" />
                                    <div>
                                        <div className="font-medium text-white">Dark Mode</div>
                                        <div className="text-xs text-textMuted">Always on for command center</div>
                                    </div>
                                </div>
                                <div className="text-xs text-success font-bold uppercase tracking-wider bg-success/10 px-2 py-1 rounded border border-success/20">Enforced</div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <Bell className="w-5 h-5 text-textMuted" />
                                    <div>
                                        <div className="font-medium text-white">Notifications</div>
                                        <div className="text-xs text-textMuted">Receive alerts via email</div>
                                    </div>
                                </div>
                                <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
                                    <input type="checkbox" defaultChecked className="peer absolute w-10 h-5 opacity-0 cursor-pointer z-10" />
                                    <div className="block w-10 h-5 rounded-full bg-surfaceHighlight peer-checked:bg-primary transition-colors"></div>
                                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-5"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span>Security</span>
                        </h2>
                        <button className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 text-left px-4 py-3 rounded flex justify-between items-center transition-colors group">
                            <span className="group-hover:text-primary transition-colors">Change Password</span>
                            <span className="text-xs text-textMuted">Last changed 30 days ago</span>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
