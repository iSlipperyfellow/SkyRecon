import { motion } from 'framer-motion'
import { Users, Key, Lock, Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'

export default function AdminPanel() {
  const [adminTab, setAdminTab] = useState('settings')

  const users = [
    { id: 1, email: 'drone.operator@example.com', role: 'operator', status: 'active' },
    { id: 2, email: 'security.officer@example.com', role: 'operator', status: 'active' },
    { id: 3, email: 'analyst@example.com', role: 'analyst', status: 'active' },
    { id: 4, email: 'admin@example.com', role: 'admin', status: 'active' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h2>
        <p className="text-gray-600 dark:text-gray-400">System configuration and management</p>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'security', label: 'Security', icon: Lock },
          { id: 'api-keys', label: 'API Keys', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
                adminTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {adminTab === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Auto-Acknowledge Low Confidence Detections
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded" />
                <span className="text-gray-700 dark:text-gray-300">Enable automatic acknowledgement</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Confidence Threshold
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="75"
                  className="flex-1"
                />
                <span className="text-xl font-bold text-primary-600">75%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Detections below this threshold require manual verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Patrol Interval
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option>3 minutes</option>
                <option selected>5 minutes</option>
                <option>10 minutes</option>
                <option>15 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Hazard Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                defaultValue="6.0"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Hazards with score above this will trigger immediate alerts
              </p>
            </div>

            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Save Settings
            </button>
          </div>
        </motion.div>
      )}

      {adminTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">Role: {user.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700">
                  {user.status}
                </span>
                <button className="text-gray-500 hover:text-danger transition-colors">Deactivate</button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {adminTab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Security Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  <span className="text-gray-700 dark:text-gray-300">Two-factor authentication required</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  <span className="text-gray-700 dark:text-gray-300">Audit logging enabled</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                  <span className="text-gray-700 dark:text-gray-300">IP whitelist enabled</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {adminTab === 'api-keys' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
          <div className="space-y-4">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Generate New API Key
            </button>
            <div className="space-y-3">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">sk-1234567890...</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Created 2024-11-01</p>
                </div>
                <button className="text-danger hover:underline">Revoke</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
