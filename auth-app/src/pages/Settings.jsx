import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import DashboardNav from '@/components/dashboard/DashboardNav'
import { Moon, Sun, Bell, LogOut, Trash2 } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <DashboardNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your preferences and account settings
          </p>
        </motion.div>

        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="text-secondary-500" size={24} />
              ) : (
                <Sun className="text-accent" size={24} />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose your preferred theme
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isDark ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <motion.span
                layout
                className="inline-block h-6 w-6 transform rounded-full bg-white"
                initial={false}
                animate={{ x: isDark ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            </motion.button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                !isDark
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onClick={() => !isDark || toggleTheme()}
            >
              <Sun size={20} className="mb-2 text-accent" />
              <p className="font-semibold text-gray-900">Light Mode</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                isDark
                  ? 'border-primary-500 bg-primary-500/5'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onClick={() => isDark || toggleTheme()}
            >
              <Moon size={20} className="mb-2 text-primary-500" />
              <p className="font-semibold text-gray-900 dark:text-white">Dark Mode</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-8 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-secondary-500" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email notifications
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <motion.span
                layout
                className="inline-block h-6 w-6 transform rounded-full bg-white"
                initial={false}
                animate={{ x: notifications ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-8 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Account
          </h3>
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell size={20} className="text-secondary-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Connected Accounts
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-8 border-2 border-red-200 dark:border-red-900/30"
        >
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">
            Danger Zone
          </h3>
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors border border-red-300 dark:border-red-900"
            >
              <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <LogOut size={20} />
                Sign Out
              </span>
              <span className="text-sm text-red-600 dark:text-red-400">Immediate</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors border border-red-300 dark:border-red-900"
            >
              <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <Trash2 size={20} />
                Delete Account
              </span>
              <span className="text-sm text-red-600 dark:text-red-400">Permanent</span>
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
