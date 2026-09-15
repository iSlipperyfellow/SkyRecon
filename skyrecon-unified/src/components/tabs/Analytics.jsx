import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
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
} from 'chart.js'
import { Line, Bar, Radar } from 'react-chartjs-2'
import { Download } from 'lucide-react'
import { apiService } from '@/services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiService.getAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) return <div className="text-center py-8">Loading analytics...</div>

  const detectionChart = {
    labels: analytics.detectionTrend.map((d) => d.date),
    datasets: [
      {
        label: 'Detections',
        data: analytics.detectionTrend.map((d) => d.count),
        borderColor: 'rgb(147, 85, 255)',
        backgroundColor: 'rgba(147, 85, 255, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const accuracyChart = {
    labels: analytics.accuracyTrend.map((d) => d.date),
    datasets: [
      {
        label: 'Model Accuracy',
        data: analytics.accuracyTrend.map((d) => d.accuracy * 100),
        borderColor: 'rgb(11, 165, 236)',
        backgroundColor: 'rgba(11, 165, 236, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const typeChart = {
    labels: Object.keys(analytics.detectionsByType),
    datasets: [
      {
        label: 'Detections by Type',
        data: Object.values(analytics.detectionsByType),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  }

  const radarData = {
    labels: ['Detection Rate', 'Accuracy', 'Response Time', 'Confidence', 'Coverage'],
    datasets: [
      {
        label: 'Performance',
        data: [85, 87, 75, 88, 90],
        borderColor: 'rgb(147, 85, 255)',
        backgroundColor: 'rgba(147, 85, 255, 0.1)',
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics & Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">System performance metrics and detection statistics</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          <Download size={18} /> Export
        </motion.button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Detections</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalDetections}</p>
        </div>
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Confidence</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {(analytics.averageConfidence * 100).toFixed(1)}%
          </p>
        </div>
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Response Time</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.averageResponseTime}s</p>
        </div>
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolved Hazards</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.resolvedHazards}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Detection Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detection Trend</h3>
          <Line
            data={detectionChart}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { color: '#9ca3af' } },
                x: { ticks: { color: '#9ca3af' } },
              },
            }}
          />
        </motion.div>

        {/* Accuracy Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Model Accuracy</h3>
          <Line
            data={accuracyChart}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 0, max: 100, ticks: { color: '#9ca3af' } },
                x: { ticks: { color: '#9ca3af' } },
              },
            }}
          />
        </motion.div>

        {/* Detection Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detections by Type</h3>
          <Bar
            data={typeChart}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { color: '#9ca3af' } }, x: { ticks: { color: '#9ca3af' } } },
            }}
          />
        </motion.div>

        {/* Performance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">System Performance</h3>
          <Radar
            data={radarData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { r: { ticks: { color: '#9ca3af' } } },
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
