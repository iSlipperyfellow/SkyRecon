import { motion } from 'framer-motion'
import { Copter, Eye, Map, Bell, BarChart3, Shield, Brain } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'

const DASHBOARD_CARDS = [
  {
    id: 'missions',
    title: 'Mission Control',
    description: 'Monitor and control drone operations',
    icon: Copter,
    status: 'active',
    color: 'from-primary-500 to-primary-600',
  },
  {
    id: 'detection',
    title: 'Live Detection Feed',
    description: 'Real-time detection feed',
    icon: Eye,
    status: 'active',
    color: 'from-primary-500 to-primary-600',
  },
  {
    id: 'hazard-map',
    title: 'Hazard Map',
    description: 'Geospatial debris visualization',
    icon: Map,
    status: 'warning',
    color: 'from-warning/500 to-warning/600',
  },
  {
    id: 'alerts',
    title: 'Alerts',
    description: 'Active alerts & notifications',
    icon: Bell,
    status: 'warning',
    color: 'from-warning/500 to-warning/600',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Detection stats & reports',
    icon: BarChart3,
    status: 'active',
    color: 'from-primary-500 to-primary-600',
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    description: 'System configuration & settings',
    icon: Shield,
    status: 'active',
    color: 'from-primary-500 to-primary-600',
  },
  {
    id: 'models',
    title: 'Model Management',
    description: 'AI model training & deployment',
    icon: Brain,
    status: 'active',
    color: 'from-primary-500 to-primary-600',
  },
]

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statusDotColor = {
    active: 'bg-accent',
    warning: 'bg-warning',
    critical: 'bg-danger',
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">SkyRecon</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time AI-powered debris detection and airport hazard management system
        </p>
      </motion.div>

      {/* Stats Row */}
      {!loading && stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="glass rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Alerts</p>
            <p className="text-2xl font-bold text-danger">{stats.activeAlerts}</p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Missions</p>
            <p className="text-2xl font-bold text-accent">{stats.activeMissions}</p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Hazard Score</p>
            <p className="text-2xl font-bold text-primary-600">{stats.hazardScore}/10</p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
            <p className="text-sm font-bold text-accent capitalize">{stats.operationalStatus}</p>
          </div>
        </motion.div>
      )}

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DASHBOARD_CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ translateY: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.id)}
              className="text-left glass rounded-2xl p-6 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${statusDotColor[card.status]}`}
                    />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize">
                      {card.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {card.title}
                  </h3>
                </div>
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${card.color} text-white 
                  group-hover:shadow-lg transition-all`}
                >
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {card.description}
              </p>
              <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-2">
                Open
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
