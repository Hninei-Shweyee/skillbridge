// ─── Firebase Initialization ─────────────────────────────────────────────────
// This file reads env variables and connects the app to your Firebase project.
// All other firebase files (auth.js, firestore.js, storage.js) import from here.

import { initializeApp } from 'firebase/app'
import { getAuth }        from 'firebase/auth'
import { getFirestore }   from 'firebase/firestore'
import { getStorage }     from 'firebase/storage'

// Firebase config object — values come from your .env file
// NEVER hard-code these values; always use environment variables
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase app (singleton — safe to call once)
const app = initializeApp(firebaseConfig)

// Export the services we'll use throughout the app
export const auth    = getAuth(app)      // Authentication
export const db      = getFirestore(app) // Firestore database
export const storage = getStorage(app)   // File storage

export default app
