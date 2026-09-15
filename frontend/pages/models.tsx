import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Upload, Play, Trash2, Archive, CheckCircle, Activity, Box } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Model {
    id: string;
    name: string;
    version: string;
    status: 'deployed' | 'training' | 'archived' | 'ready';
    accuracy: number;
    lastUpdated: string;
    framework: string;
    is_active: boolean;
}

export default function Models() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchModels = async () => {
        try {
            const res = await apiClient.getModels();
            const dataArray = res.data.results || res.data;
            if (!Array.isArray(dataArray)) {
                 console.error("API did not return an array", res.data);
                 return;
            }
            const formatted: Model[] = dataArray.map((m: any) => ({
                id: m.id,
                name: m.name,
                version: m.version,
                status: m.status?.toLowerCase() || 'ready',
                accuracy: m.accuracy,
                lastUpdated: m.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                framework: m.framework,
                is_active: m.is_active
            }));
            setModels(formatted);
        } catch (e) {
            console.error('Failed to fetch models', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file_path', file);
        formData.append('name', file.name.replace('.pt', '').replace('.onnx', ''));
        formData.append('version', '1.0.0');
        formData.append('framework', 'YOLO');
        formData.append('status', 'READY');

        try {
            await apiClient.uploadModel(formData);
            await fetchModels();
        } catch (err) {
            console.error('Upload failed', err);
            window.alert('Failed to upload model. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeploy = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Deploy button clicked for id:', id);
        try {
            await apiClient.deployModel(id);
            await fetchModels();
        } catch (err) {
            console.error('Deployment failed', err);
            window.alert('Failed to deploy model.');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Delete button clicked for id:', id);
        if (!window.confirm('Are you sure you want to delete this model?')) return;
        try {
            await apiClient.deleteModel(id);
            await fetchModels();
        } catch (err) {
            console.error('Delete failed', err);
            window.alert('Failed to delete model.');
        }
    };

    const handleArchive = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Archive button clicked for id:', id);
        try {
            await apiClient.archiveModel(id);
            await fetchModels();
        } catch (err) {
            console.error('Archive failed', err);
            window.alert('Failed to archive model.');
        }
    };

    const activeModel = models.find(m => m.is_active);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pt,.onnx" 
                    onChange={handleFileChange} 
                />
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Model Management</h1>
                        <p className="text-textMuted">Manage AI models, training, and deployment</p>
                    </div>
                    <button 
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="px-4 py-2 bg-primary text-white hover:bg-blue-600 flex items-center space-x-2 rounded-lg shadow-lg shadow-primary/20 transition-all font-medium disabled:opacity-50"
                    >
                        <Upload className={`w-4 h-4 ${uploading ? 'animate-pulse' : ''}`} />
                        <span>{uploading ? 'Uploading...' : 'Upload New Model'}</span>
                    </button>
                </div>

                {/* Active Deployment Card */}
                {activeModel ? (
                    <div className="glass-panel p-6 mb-8 border-l-4 border-l-success relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Activity className="w-32 h-32 text-success" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                        <Activity className="w-5 h-5 text-success" />
                                        <span>Active Deployment</span>
                                    </h2>
                                    <p className="text-textMuted mt-1">Currently serving inference requests</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white font-mono">{activeModel.version}</div>
                                    <div className="text-xs text-success font-bold uppercase tracking-wider flex items-center justify-end space-x-1">
                                        <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                        <span>Healthy</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-white/5 rounded border border-white/5 backdrop-blur-sm">
                                    <div className="text-xs text-textMuted uppercase tracking-wider">Name</div>
                                    <div className="text-white font-bold">{activeModel.name}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5 backdrop-blur-sm">
                                    <div className="text-xs text-textMuted uppercase tracking-wider">Framework</div>
                                    <div className="text-white font-bold font-mono">{activeModel.framework}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5 backdrop-blur-sm">
                                    <div className="text-xs text-textMuted uppercase tracking-wider">Accuracy</div>
                                    <div className="text-white font-bold font-mono">{activeModel.accuracy}%</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5 backdrop-blur-sm">
                                    <div className="text-xs text-textMuted uppercase tracking-wider">Last Deployed</div>
                                    <div className="text-white font-bold">{activeModel.lastUpdated}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel p-6 mb-8 border-l-4 border-l-warning flex items-center space-x-4">
                        <Activity className="w-8 h-8 text-warning opacity-50" />
                        <div>
                            <h2 className="text-lg font-bold text-white">No Active Deployment</h2>
                            <p className="text-textMuted">Select a model from the registry below and click deploy.</p>
                        </div>
                    </div>
                )}

                {/* Model List */}
                <div className="glass-panel overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <h3 className="font-bold text-white">Model Registry</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-textMuted">
                            <thead className="text-xs uppercase bg-white/5 text-white">
                                <tr>
                                    <th className="px-6 py-3">Model Name</th>
                                    <th className="px-6 py-3">Framework</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Accuracy</th>
                                    <th className="px-6 py-3">Last Updated</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {models.map((model) => (
                                    <tr key={model.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-white/5 rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                    <Box className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-primary transition-colors">{model.name}</div>
                                                    <div className="text-xs font-mono">{model.version}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs bg-white/10 text-white border border-white/10 font-mono">
                                                {model.framework}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${model.status === 'deployed' ? 'bg-success/20 text-success border border-success/20' :
                                                    model.status === 'training' ? 'bg-warning/20 text-warning border border-warning/20 animate-pulse' :
                                                        model.status === 'archived' ? 'bg-secondary/20 text-secondary border border-secondary/20' :
                                                            'bg-info/20 text-info border border-info/20'
                                                }`}>
                                                {model.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-white">
                                            {model.accuracy > 0 ? `${model.accuracy}%` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {model.lastUpdated}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2 transition-opacity z-10 relative">
                                                {!model.is_active && (
                                                    <button 
                                                        onClick={(e) => handleDeploy(e, model.id)}
                                                        className="p-2 hover:bg-success/20 text-success rounded transition-colors" 
                                                        title="Deploy"
                                                    >
                                                        <Play className="w-4 h-4 pointer-events-none" />
                                                    </button>
                                                )}
                                                {model.status !== 'archived' && (
                                                    <button onClick={(e) => handleArchive(e, model.id)} className="p-2 hover:bg-white/10 text-textMuted hover:text-white rounded transition-colors" title="Archive">
                                                        <Archive className="w-4 h-4 pointer-events-none" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => handleDelete(e, model.id)}
                                                    className="p-2 hover:bg-danger/20 text-danger rounded transition-colors" 
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 pointer-events-none" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
