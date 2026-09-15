import { initializeApp } from 'firebase/app'
import {
  getAuth,
  connectAuthEmulator,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'test-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-auth-domain',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'test-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-bucket.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123:web:abc',
}

let app
let auth

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
} catch (error) {
  console.error('Firebase initialization error:', error)
  console.warn('Firebase is not configured. Using mock auth for development.')
}

export { auth }
export default app

// Uncomment for local emulator testing
// if (window.location.hostname === 'localhost' && auth) {
//   connectAuthEmulator(auth, 'http://localhost:9099')
// }
