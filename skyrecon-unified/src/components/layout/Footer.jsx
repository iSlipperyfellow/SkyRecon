import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 px-4 py-2"
    >
      <div className="max-w-full flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>© 2024 SkyRecon - AI Debris Detection System</span>
        <div className="flex items-center gap-4">
          <span>v1.0.0</span>
          <a href="#" className="hover:text-primary-600 transition-colors">
            API Docs
          </a>
          <a href="#" className="hover:text-primary-600 transition-colors">
            Support
          </a>
        </div>
      </div>
    </motion.footer>
  )
}
