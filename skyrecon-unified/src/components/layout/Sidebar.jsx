import { motion } from 'framer-motion'
import { useSystem } from '@/hooks/useSystem'
import { useAuth } from '@/hooks/useAuth'
import {
  Home,
  Bell,
  Copter,
  Eye,
  Map,
  BarChart3,
  Brain,
  Shield,
  Settings,
  ChevronRight,
} from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'missions', label: 'Missions', icon: Copter },
  { id: 'detection', label: 'Detection Feed', icon: Eye },
  { id: 'hazard-map', label: 'Hazard Map', icon: Map },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'models', label: 'Models', icon: Brain },
]

const ADMIN_TABS = [{ id: 'admin', label: 'Admin Panel', icon: Shield }]

export default function Sidebar({ currentTab, onTabChange }) {
  const { sidebarOpen, toggleSidebar } = useSystem()
  const { user } = useAuth()

  const visibleTabs = [...TABS, ...(user?.role === 'admin' ? ADMIN_TABS : [])]

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-16 h-[calc(100vh-64px-80px)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800/50 overflow-y-auto z-40 md:translate-x-0"
      >
        <nav className="p-4 space-y-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onTabChange(tab.id)
                  window.innerWidth < 768 && toggleSidebar()
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium flex-1 text-left">{tab.label}</span>
                {isActive && <ChevronRight size={18} />}
              </motion.button>
            )
          })}
        </nav>
      </motion.aside>

      {/* Margin for desktop */}
      <div className="hidden md:block w-64" />
    </>
  )
}
