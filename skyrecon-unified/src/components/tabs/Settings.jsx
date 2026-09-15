import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSystem } from '@/hooks/useSystem'

export default function Settings() {
  const { currentAirport, setCurrentAirport } = useSystem()
  const [settings, setSettings] = useState({
    theme: 'auto',
    notifications: true,
    emailAlerts: true,
    dataRetention: 30,
  })

  const airports = [
    { id: 'kia-karachi', name: 'Karachi International (KIA)' },
    { id: 'jia-dubai', name: 'Dubai International (OMDB)' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Customize your SkyRecon experience</p>
      </div>

      {/* Preferences */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-6">
        <h3 className="font-bold text-gray-900 dark:text-white">Preferences</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Default Airport
          </label>
          <select
            value={currentAirport}
            onChange={(e) => setCurrentAirport(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {airports.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="auto">Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Data Retention (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.dataRetention}
            onChange={(e) => setSettings((prev) => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 space-y-6"
      >
        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings((prev) => ({ ...prev, notifications: e.target.checked }))}
            className="w-5 h-5 rounded"
          />
          <div>
            <p className="text-gray-900 dark:text-white font-medium">In-App Notifications</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get alerts in the browser</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailAlerts}
            onChange={(e) => setSettings((prev) => ({ ...prev, emailAlerts: e.target.checked }))}
            className="w-5 h-5 rounded"
          />
          <div>
            <p className="text-gray-900 dark:text-white font-medium">Email Alerts</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Critical hazards sent to your email</p>
          </div>
        </label>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 space-y-6"
      >
        <h3 className="font-bold text-gray-900 dark:text-white">Account</h3>

        <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          Change Password
        </button>

        <button className="w-full px-4 py-2 border border-danger rounded-lg font-semibold text-danger hover:bg-danger/10 transition-colors">
          Delete Account
        </button>
      </motion.div>

      {/* Save */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        Save Settings
      </motion.button>
    </div>
  )
}
