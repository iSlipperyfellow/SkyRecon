import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import Layout from '@/components/Layout';
import DashboardCard from '@/components/DashboardCard';
import {
  Crosshair,
  Video,
  Map as MapIcon,
  Bell,
  BarChart2,
  ShieldAlert,
  Cpu,
  Activity
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    activeDrones: 0,
    activeAlerts: 0,
    recentDetections: 0,
    criticalZones: 0,
    deployedModel: 'v1.0.0',
    cpuLoad: 0,
    systemStatus: 'NOMINAL'
  });
  const [errorLog, setErrorLog] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Fetch real stats where possible
    const fetchStats = async () => {
      try {
        // Fetch from actual API endpoints
        const [dronesRes, hazardsRes, alertsRes, modelsRes, healthRes] = await Promise.all([
          apiClient.getDrones().catch((e) => { setErrorLog(prev => prev + '|drones:' + e.message); return { data: { count: 0, results: [] } } }),
          apiClient.getDetections({ limit: 1 }).catch((e) => { setErrorLog(prev => prev + '|detections:' + e.message); return { data: { count: 0, results: [] } } }),
          apiClient.getHazards({ archived: 'false' }).catch((e) => { setErrorLog(prev => prev + '|hazards:' + e.message); return { data: { count: 0, results: [] } } }),
          apiClient.getModels().catch((e) => { setErrorLog(prev => prev + '|models:' + e.message); return { data: { count: 0, results: [] } } }),
          apiClient.getHealthMetrics().catch((e) => { setErrorLog(prev => prev + '|health:' + e.message); return { data: { system: { cpu_percent: 12 } } } })
        ]);

        // Helper to safely extract arrays and counts, supporting both normal paginated arrays and GeoJSON FeatureCollections
        const extractList = (res: any) => {
            if (Array.isArray(res.data)) return res.data;
            if (res.data?.results) {
                if (res.data.results.type === 'FeatureCollection' && Array.isArray(res.data.results.features)) {
                    return res.data.results.features.map((f: any) => ({ ...f.properties, id: f.id }));
                }
                if (Array.isArray(res.data.results)) return res.data.results;
            }
            return [];
        };
        const extractCount = (res: any) => Array.isArray(res.data) ? res.data.length : (res.data?.count || 0);

        const dronesList = extractList(dronesRes);
        const alertsList = extractList(alertsRes);
        const modelsList = extractList(modelsRes);

        // Calculate Critical Zones (Handle both uppercase and lowercase DB entries)
        const criticalCount = alertsList.filter((h: any) => 
            h.level?.toLowerCase() === 'high' || h.level?.toLowerCase() === 'critical'
        ).length;

        // Find Deployed Model
        let activeModel = 'yolov8n.pt';
        const deployed = modelsList.find((m: any) => m.status === 'DEPLOYED');
        if (deployed) activeModel = deployed.version || deployed.name;

        // Count active drones
        const activeDroneCount = dronesList.filter((d: any) => d.status === 'ACTIVE').length || extractCount(dronesRes);

        setStats(prev => ({
          ...prev,
          activeDrones: activeDroneCount,
          recentDetections: extractCount(hazardsRes),
          activeAlerts: extractCount(alertsRes),
          criticalZones: criticalCount,
          deployedModel: activeModel,
          cpuLoad: parseFloat((healthRes.data?.infrastructure?.cpu_load || '12').replace('%', ''))
        }));
      } catch (e: any) {
        console.error(e);
        setErrorLog('JS Runtime Error: ' + (e.message || String(e)));
      }
    };
    
    fetchStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Command Center</h1>
          <div className="flex items-center space-x-2 text-textMuted">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-sm font-medium tracking-wide">SYSTEM ONLINE • {stats.systemStatus}</span>
          </div>
          {errorLog && <div className="text-xs text-red-500 mt-2 font-mono break-words bg-black/50 p-2 rounded">{errorLog}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Mission Control */}
          <DashboardCard
            title="Mission Control"
            subtext="Monitor and control drone operations"
            href="/mission-control"
            status={stats.activeDrones > 0 ? "active" : "inactive"}
            icon={<Crosshair />}
          >
            <div className="flex items-end space-x-2 mt-2">
              <span className="text-3xl font-bold text-white">
                <CountUp end={stats.activeDrones} duration={2} preserveValue />
              </span>
              <span className="text-sm text-textMuted mb-1">Active Drones</span>
            </div>
          </DashboardCard>

          {/* 2. Live Feed */}
          <DashboardCard
            title="Live Feed"
            subtext="Real-time detection feed"
            href="/live-feed"
            status={stats.activeDrones > 0 ? "active" : "inactive"}
            icon={<Video />}
          >
            <div className={`relative h-16 rounded-lg overflow-hidden border mt-2 transition-colors duration-500 ${stats.activeDrones > 0 ? 'bg-black/50 border-white/10 group-hover:border-primary/50' : 'bg-surface/50 border-white/5'}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                {stats.activeDrones > 0 ? (
                    <span className="text-xs text-success animate-pulse font-mono flex items-center">
                        <span className="w-2 h-2 rounded-full bg-success mr-2 shadow-[0_0_8px_#10b981]" />
                        LIVE SIGNAL
                    </span>
                ) : (
                    <span className="text-xs text-textMuted font-mono">NO SIGNAL</span>
                )}
              </div>
              {/* Scanline effect */}
              {stats.activeDrones > 0 && <div className="absolute inset-0 scanline opacity-30 pointer-events-none"></div>}
            </div>
          </DashboardCard>

          {/* 3. Hazard Map */}
          <DashboardCard
            title="Hazard Map"
            subtext="Geospatial debris visualization"
            href="/hazard-map"
            status={stats.criticalZones > 0 ? "critical" : "active"}
            icon={<MapIcon />}
          >
            <div className={`mt-2 text-sm flex items-center ${stats.criticalZones > 0 ? 'text-danger' : 'text-success'}`}>
              <span className="font-bold text-lg mr-1">
                <CountUp end={stats.criticalZones} duration={1.5} preserveValue />
              </span> 
              Critical Zones
            </div>
          </DashboardCard>

          {/* 4. Alerts */}
          <DashboardCard
            title="Alerts"
            subtext="Active alerts & notifications"
            href="/alerts"
            status={stats.activeAlerts > 0 ? "warning" : "active"}
            icon={<Bell />}
          >
            <div className="flex items-end space-x-2 mt-2">
              <span className={`text-3xl font-bold ${stats.activeAlerts > 0 ? 'text-warning' : 'text-white'}`}>
                <CountUp end={stats.activeAlerts} duration={2} preserveValue />
              </span>
              <span className="text-sm text-textMuted mb-1">New Alerts</span>
            </div>
          </DashboardCard>

          {/* 5. Analytics */}
          <DashboardCard
            title="Analytics"
            subtext="Detection stats & reports"
            href="/analytics"
            status="active"
            icon={<BarChart2 />}
          >
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">
                <CountUp end={stats.recentDetections} duration={2.5} separator="," preserveValue />
              </div>
              <div className="text-xs text-textMuted">Total Detections</div>
            </div>
          </DashboardCard>

          {/* 6. Admin Panel */}
          <DashboardCard
            title="Admin Panel"
            subtext="System configuration"
            href="/admin"
            status="active"
            icon={<ShieldAlert />}
          />

          {/* 7. Model Management */}
          <DashboardCard
            title="AI Models"
            subtext="Model training & deployment"
            href="/models"
            status="active"
            icon={<Cpu />}
          >
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded border border-primary/20 font-mono transition-all group-hover:bg-primary/30 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                {stats.deployedModel}
              </span>
              <span className="text-xs text-textMuted">Deployed</span>
            </div>
          </DashboardCard>

          {/* 8. System Health */}
          <DashboardCard
            title="System Health"
            subtext="Infrastructure status"
            href="/settings"
            status={stats.cpuLoad > 80 ? 'warning' : 'active'}
            icon={<Activity />}
          >
            <div className="mt-2 space-y-1 group-hover:brightness-125 transition-all">
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">CPU Load</span>
                <span className={`${stats.cpuLoad > 80 ? 'text-warning' : 'text-success'} font-mono transition-colors`}>
                    <CountUp end={stats.cpuLoad} suffix="%" duration={1} preserveValue />
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <div 
                    className={`${stats.cpuLoad > 80 ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]'} h-1 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${stats.cpuLoad}%` }} 
                />
              </div>
            </div>
          </DashboardCard>

        </div>
      </div>
    </Layout>
  );
}
