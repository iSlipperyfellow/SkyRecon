import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Upload, Zap, Archive, Trash2, CheckCircle } from 'lucide-react'
import { apiService } from '@/services/api'

export default function ModelManagement() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    framework: '',
    dataset: '',
  })

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await apiService.getModels()
        setModels(data)
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  const handleUploadModel = async (e) => {
    e.preventDefault()
    const newModel = {
      id: 'model-' + Date.now(),
      name: formData.name,
      version: '1.0.0',
      status: 'staging',
      accuracy: 0.88,
      latency: 50,
      deployedAt: new Date(),
      framework: formData.framework,
      size: '256MB',
      detections: 0,
    }
    setModels((prev) => [newModel, ...prev])
    setFormData({ name: '', framework: '', dataset: '' })
    setShowUploadForm(false)
  }

  const handleDeploy = async (modelId) => {
    await apiService.deployModel(modelId)
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'active', deployedAt: new Date() } : m))
    )
  }

  const handleArchive = async (modelId) => {
    await apiService.archiveModel(modelId)
    setModels((prev) => prev.filter((m) => m.id !== modelId))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Model Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Deploy and manage AI detection models</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          <Upload size={18} /> Upload Model
        </motion.button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <motion.form
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleUploadModel}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Model Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., YOLOv8-Large Debris Detector v2"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Framework
              </label>
              <select
                value={formData.framework}
                onChange={(e) => setFormData((prev) => ({ ...prev, framework: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Framework</option>
                <option value="YOLOv8">YOLOv8</option>
                <option value="TensorFlow">TensorFlow</option>
                <option value="PyTorch">PyTorch</option>
                <option value="ONNX">ONNX</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Training Dataset
              </label>
              <input
                type="text"
                value={formData.dataset}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataset: e.target.value }))}
                placeholder="Select dataset..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Models List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading models...</div>
        ) : models.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No models deployed</div>
        ) : (
          models.map((model, i) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                {/* Model Info */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{model.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">v{model.version}</p>
                  <p className="text-xs text-gray-500 mt-1">{model.framework}</p>
                </div>

                {/* Metrics */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Accuracy</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {(model.accuracy * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Latency</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{model.latency}ms</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      model.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                    }`}
                  >
                    {model.status === 'active' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      'Staging'
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {model.status === 'staging' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeploy(model.id)}
                      className="p-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg transition-colors"
                      title="Deploy"
                    >
                      <Zap size={18} />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleArchive(model.id)}
                    className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <Archive size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
