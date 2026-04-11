// ─── Firebase Auth Helpers ────────────────────────────────────────────────────
// Simple wrapper functions around Firebase Auth.
// Components import these instead of calling Firebase directly —
// makes it easier to swap auth providers later if needed.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

// ─── Sign Up with email + password ───────────────────────────────────────────
export async function signUpWithEmail(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  // Set the display name right after account creation
  await updateProfile(credential.user, { displayName })
  return credential.user
}

// ─── Sign In with email + password ───────────────────────────────────────────
export async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// ─── Sign In with Google (popup) ─────────────────────────────────────────────
export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

// ─── Sign Out ────────────────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth)
}

// ─── Listen to auth state changes ────────────────────────────────────────────
// Returns an unsubscribe function — call it to stop listening
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// ─── Get current user (synchronous snapshot) ─────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser
}
