import { createContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'

const AuthContext = createContext()

const USE_MOCK_AUTH = !import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID === 'test-project'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshUser = useCallback(() => {
    if (USE_MOCK_AUTH) {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      } else {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      // Mock auth - check localStorage
      refreshUser()
      setLoading(false)

      // Listen for storage changes (login/logout from other tabs)
      const handleStorageChange = (e) => {
        if (e.key === 'currentUser') {
          refreshUser()
        }
      }
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    } else {
      // Real Firebase auth
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
        setLoading(false)
      })
      return () => unsubscribe()
    }
  }, [refreshUser])

  const value = {
    user,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export default AuthProvider
