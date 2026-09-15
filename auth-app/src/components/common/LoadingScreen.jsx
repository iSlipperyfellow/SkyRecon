import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-950 dark:to-primary-950 flex items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="relative w-16 h-16"
      >
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 border-r-secondary-600" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 text-gray-600 dark:text-gray-400 font-medium"
      >
        Loading...
      </motion.p>
    </motion.div>
  )
}
