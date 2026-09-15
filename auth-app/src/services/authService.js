import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { auth } from './firebase'

// Mock users for development/testing
const MOCK_USERS = {
  'drone.operator@example.com': { password: 'operator123', displayName: 'John Drone Operator', role: 'drone_operator' },
  'security.officer@example.com': { password: 'security123', displayName: 'Sarah Airport Security', role: 'security_officer' },
  'analyst@example.com': { password: 'analyst123', displayName: 'Mike Data Analyst', role: 'analyst' },
  'admin@example.com': { password: 'admin123', displayName: 'Admin User', role: 'admin' },
  'test@example.com': { password: 'test123', displayName: 'Test User', role: 'user' },
}

// In-memory storage for development
const devUsers = new Map()

// Load mock users into dev storage
Object.entries(MOCK_USERS).forEach(([email, data]) => {
  devUsers.set(email, { ...data, uid: email })
})

const USE_MOCK_AUTH = !import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID === 'test-project'

export const authService = {
  async register(email, password, displayName) {
    try {
      if (USE_MOCK_AUTH) {
        // Mock registration
        if (devUsers.has(email)) {
          throw new Error('Email already in use')
        }
        const user = { email, password, displayName, uid: email }
        devUsers.set(email, user)
        localStorage.setItem('currentUser', JSON.stringify(user))
        return { email, displayName, uid: email }
      }

      await setPersistence(auth, browserLocalPersistence)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }
      return result.user
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async login(email, password, rememberMe = false) {
    try {
      if (USE_MOCK_AUTH) {
        // Mock login
        const user = devUsers.get(email)
        if (!user || user.password !== password) {
          throw new Error('Invalid email or password')
        }
        const userData = { email: user.email, displayName: user.displayName, uid: user.uid }
        localStorage.setItem('currentUser', JSON.stringify(userData))
        return userData
      }

      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence)
      }
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async logout() {
    try {
      if (USE_MOCK_AUTH) {
        localStorage.removeItem('currentUser')
        return
      }
      await signOut(auth)
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async resetPassword(email) {
    try {
      if (USE_MOCK_AUTH) {
        // Mock password reset - just check if user exists
        const user = devUsers.get(email)
        if (!user) {
          throw new Error('User not found')
        }
        // In mock mode, just pretend it worked
        return
      }
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async confirmReset(code, newPassword) {
    try {
      if (USE_MOCK_AUTH) {
        // Mock reset - just update password in devUsers
        // In real scenario, you'd parse the code to get the email
        return
      }
      await confirmPasswordReset(auth, code, newPassword)
    } catch (error) {
      throw this.handleError(error)
    }
  },

  handleError(error) {
    if (typeof error === 'string') {
      return new Error(error)
    }
    const errorMessages = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Wrong password',
      'auth/too-many-requests': 'Too many attempts. Please try later',
      'auth/operation-not-allowed': 'Operation not allowed',
    }
    const message = typeof error === 'string' ? error : (errorMessages[error.code] || error.message)
    const errorObj = new Error(message)
    errorObj.code = error.code
    return errorObj
  },
}

