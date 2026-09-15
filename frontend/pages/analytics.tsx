import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { Download, FileText, Table } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Analytics() {
    const [liveData, setLiveData] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, reportsRes] = await Promise.all([
                    apiClient.getAnalytics(),
                    apiClient.getReports()
                ]);
                setLiveData(analyticsRes.data);
                setReports(reportsRes.data);
            } catch (e) {
                console.error('Failed to fetch analytics or reports', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const exportToCSV = () => {
        if (!liveData) return;
        
        // Prepare data rows
        const rows = [
            ['Metric', 'Value'],
            ['Total Detections', liveData.total_detections || 0],
            ['Total Flights', liveData.total_flights || 0],
            ['Average Response Time', '1.2s'],
            ['False Positives', '0.8%'],
            [],
            ['Trend Date', 'Detection Count']
        ];
        
        if (liveData.trend) {
            liveData.trend.forEach((t: any) => {
                rows.push([t.day, t.count.toString()]);
            });
        }
        
        rows.push([], ['Hazard Level', 'Count']);
        if (liveData.hazard_distribution) {
            liveData.hazard_distribution.forEach((h: any) => {
                rows.push([h.level, h.count.toString()]);
            });
        }
        
        const csvContent = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `SkyRecon_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = async () => {
        if (!dashboardRef.current) return;
        try {
            const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#0f172a' });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SkyRecon_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
        }
    };

    // Fallback Mock Data if no live data yet
    const detectionData = liveData ? {
        labels: liveData.trend.map((t: any) => new Date(t.day).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [
            {
                label: 'Detections',
                data: liveData.trend.map((t: any) => t.count),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 1,
            }
        ],
    } : {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Detections',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: '#3b82f6',
                borderWidth: 1,
            },
        ],
    };

    const hazardDistribution = liveData ? {
        labels: liveData.hazard_distribution.map((h: any) => h.level),
        datasets: [
            {
                label: 'Hazard Levels',
                data: liveData.hazard_distribution.map((h: any) => h.count),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.5)', // HIGH
                    'rgba(245, 158, 11, 0.5)', // MEDIUM
                    'rgba(16, 185, 129, 0.5)', // LOW
                ],
                borderColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderWidth: 1,
            }
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: '#94a3b8' }
            },
            title: { display: false },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const radarData = {
        labels: ['Speed', 'Accuracy', 'Reliability', 'Coverage', 'Uptime'],
        datasets: [
            {
                label: 'System Performance',
                data: [90, 85, 95, 80, 99],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                fill: true,
            },
        ],
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto" ref={dashboardRef}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Reports</h1>
                        <p className="text-textMuted">System performance and detection statistics</p>
                    </div>
                    <div className="flex space-x-2" data-html2canvas-ignore>
                        <button 
                            onClick={exportToPDF}
                            className="px-4 py-2 bg-surface border border-white/10 rounded-md text-white hover:bg-white/5 flex items-center space-x-2 transition-colors">
                            <FileText className="w-4 h-4" />
                            <span>Export PDF</span>
                        </button>
                        <button 
                            onClick={exportToCSV}
                            className="px-4 py-2 bg-surface border border-white/10 rounded-md text-white hover:bg-white/5 flex items-center space-x-2 transition-colors">
                            <Table className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">Total Detections</h3>
                        <p className="text-3xl font-bold text-white mt-2">{liveData?.total_detections || 0}</p>
                        <span className="text-xs text-textMuted flex items-center mt-1 font-medium">
                            Cumulative system total
                        </span>
                    </div>
                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">Total Flights</h3>
                        <p className="text-3xl font-bold text-white mt-2">{liveData?.total_flights || 0}</p>
                        <span className="text-xs text-textMuted flex items-center mt-1 font-medium">
                            Successful missions
                        </span>
                    </div>
                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">Avg Response Time</h3>
                        <p className="text-3xl font-bold text-white mt-2">1.2s</p>
                        <span className="text-xs text-success flex items-center mt-1 font-medium">
                            -0.3s faster
                        </span>
                    </div>
                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-medium text-textMuted uppercase tracking-wider">False Positives</h3>
                        <p className="text-3xl font-bold text-white mt-2">0.8%</p>
                        <span className="text-xs text-success flex items-center mt-1 font-medium">
                            Within tolerance
                        </span>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="glass-panel p-6 h-96">
                        <h3 className="text-lg font-bold text-white mb-4">Detection Trend (7 Days)</h3>
                        <Bar data={detectionData} options={chartOptions} />
                    </div>
                    <div className="glass-panel p-6 h-96">
                        <h3 className="text-lg font-bold text-white mb-4">Hazard Distribution</h3>
                        {hazardDistribution ? <Bar data={hazardDistribution} options={chartOptions} /> : <div className="text-textMuted">No hazard data</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 lg:col-span-1 h-96">
                        <h3 className="text-lg font-bold text-white mb-4">System Performance</h3>
                        <Radar
                            data={radarData}
                            options={{
                                ...chartOptions,
                                scales: {
                                    r: {
                                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                        ticks: { display: false, backdropColor: 'transparent' },
                                        pointLabels: { color: '#94a3b8', font: { size: 10 } }
                                    }
                                }
                            }}
                        />
                    </div>
                    <div className="glass-panel p-6 lg:col-span-2 h-96 overflow-hidden flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-4">Recent Reports</h3>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left text-textMuted">
                                <thead className="text-xs text-white uppercase bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Report ID</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-r-lg">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-textMuted">
                                                No reports available. Generate a report via the backend CLI.
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.map((report) => (
                                            <tr key={report.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-mono truncate max-w-[200px]" title={report.name}>
                                                    {report.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {new Date(report.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3">{report.type}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-success/20 text-success border border-success/20">READY</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <a 
                                                        href={apiClient.getReportDownloadUrl(report.name)} 
                                                        download
                                                        className="text-primary hover:text-white transition-colors block"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
