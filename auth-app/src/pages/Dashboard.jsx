import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import DashboardNav from '@/components/dashboard/DashboardNav'
import ProfileCard from '@/components/dashboard/ProfileCard'
import { BarChart3, Users, TrendingUp, Activity } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Total Users', value: '2,543', icon: Users, color: 'from-primary-500 to-primary-600' },
    { label: 'Growth', value: '+24%', icon: TrendingUp, color: 'from-secondary-500 to-secondary-600' },
    { label: 'Revenue', value: '$12.4K', icon: BarChart3, color: 'from-accent to-green-600' },
    { label: 'Activity', value: '89%', icon: Activity, color: 'from-orange-500 to-red-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <DashboardNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {user?.displayName || 'User'}
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your account today
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProfileCard />
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 grid md:grid-cols-2 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ translateY: -5 }}
                className={`glass rounded-2xl p-6 bg-gradient-to-br ${stat.color}/10 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: 'Logged in', time: '2 hours ago', icon: '🔐' },
              { action: 'Updated profile', time: '1 day ago', icon: '👤' },
              { action: 'Changed password', time: '5 days ago', icon: '🔑' },
              { action: 'Account created', time: '1 week ago', icon: '✨' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {item.action}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.time}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
