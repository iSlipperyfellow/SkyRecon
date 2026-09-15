import { motion } from 'framer-motion'
import { getStrengthColor, getStrengthLabel } from '@/hooks/usePasswordStrength'

export default function PasswordStrength({ strength }) {
  if (strength === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2 mt-2"
    >
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? getStrengthColor(strength) : 'bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Strength: <span className="font-semibold">{getStrengthLabel(strength)}</span>
      </p>
    </motion.div>
  )
}
