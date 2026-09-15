import { createContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const MOCK_USERS = {
  'drone.operator@example.com': { password: 'operator123', displayName: 'John Operator', role: 'operator' },
  'security.officer@example.com': { password: 'security123', displayName: 'Sarah Officer', role: 'operator' },
  'analyst@example.com': { password: 'analyst123', displayName: 'Mike Analyst', role: 'analyst' },
  'admin@example.com': { password: 'admin123', displayName: 'Admin User', role: 'admin' },
  'test@example.com': { password: 'test123', displayName: 'Test User', role: 'operator' },
}

const devUsers = new Map()
Object.entries(MOCK_USERS).forEach(([email, data]) => {
  devUsers.set(email, { ...data, uid: email })
})

const USE_MOCK_AUTH = true

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
      refreshUser()
      setLoading(false)

      const handleStorageChange = (e) => {
        if (e.key === 'currentUser') {
          refreshUser()
        }
      }
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshUser])

  const login = async (email, password) => {
    const user = devUsers.get(email)
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password')
    }
    const userData = { email: user.email, displayName: user.displayName, uid: user.uid, role: user.role }
    localStorage.setItem('currentUser', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (email, password, displayName) => {
    if (devUsers.has(email)) {
      throw new Error('Email already in use')
    }
    const user = { email, password, displayName, uid: email, role: 'operator' }
    devUsers.set(email, user)
    const userData = { email: user.email, displayName: user.displayName, uid: user.uid, role: user.role }
    localStorage.setItem('currentUser', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('currentUser')
    setUser(null)
  }

  const value = {
    user,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    refreshUser,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
