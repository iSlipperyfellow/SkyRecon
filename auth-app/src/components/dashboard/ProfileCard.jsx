import { motion } from 'framer-motion'
import { User, Mail, Calendar, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function ProfileCard() {
  const { user } = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 max-w-sm"
    >
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold"
        >
          {user?.displayName?.[0]?.toUpperCase() || 'U'}
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {user?.displayName || 'User'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Premium Member</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <Mail size={18} className="text-primary-600" />
          <span className="text-sm">{user?.email || 'No email'}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <Shield size={18} className="text-secondary-600" />
          <span className="text-sm">Email Verified</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <Calendar size={18} className="text-accent" />
          <span className="text-sm">Joined {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  )
}
