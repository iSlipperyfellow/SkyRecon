import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Trash2, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await apiService.getAlerts(filter)
        setAlerts(data)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [filter])

  const severityColors = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300' },
    high: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300' },
    medium: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300' },
  }

  const handleAcknowledge = async (alertId) => {
    await apiService.acknowledgeAlert(alertId)
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Alerts & Notifications</h2>
        <p className="text-gray-600 dark:text-gray-400">Real-time alert management and response</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4">
        {['active', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No {filter} alerts</div>
        ) : (
          alerts.map((alert, i) => {
            const colors = severityColors[alert.severity] || severityColors.medium
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`${colors.bg} ${colors.border} border rounded-lg p-4 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${colors.text}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{alert.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${colors.text} bg-white/50 dark:bg-black/30 capitalize`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Location: {alert.location}</span>
                      <span>Confidence: {(alert.confidence * 100).toFixed(1)}%</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-white/50 dark:hover:bg-black/30 rounded-lg transition-colors"
                    >
                      <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAcknowledge(alert.id)}
                      className="p-2 hover:bg-white/50 dark:hover:bg-black/30 rounded-lg transition-colors"
                    >
                      <CheckCircle size={18} className="text-green-600" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
