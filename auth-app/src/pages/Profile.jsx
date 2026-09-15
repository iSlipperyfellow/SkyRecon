import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import DashboardNav from '@/components/dashboard/DashboardNav'
import { Mail, Calendar, Shield, Edit2 } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

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
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account information
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 mb-8"
        >
          {/* Profile Header */}
          <div className="flex items-start justify-between mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-4xl font-bold"
              >
                {user?.displayName?.[0]?.toUpperCase() || 'U'}
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.displayName || 'User'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Premium Account</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <Edit2 size={20} />
            </motion.button>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Full Name
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {user?.displayName || 'Not set'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {user?.email}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Shield size={16} />
                  Email Verification
                </label>
                <p className="text-lg font-semibold text-accent mt-1">
                  Verified ✓
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calendar size={16} />
                  Joined
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {new Date().toLocaleDateString()}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Security
          </h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Change Password
          </motion.button>
        </motion.div>
      </main>
    </div>
  )
}
