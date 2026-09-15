import { useState, useCallback } from 'react'

export function usePasswordStrength() {
  const [strength, setStrength] = useState(0)

  const calculateStrength = useCallback((password) => {
    let score = 0
    
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++

    setStrength(score)
    return score
  }, [])

  return { strength, calculateStrength }
}

export function getStrengthLabel(strength) {
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  return labels[strength] || ''
}

export function getStrengthColor(strength) {
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']
  return colors[strength] || ''
}
