// ─── Auth Store (Pinia) ───────────────────────────────────────────────────────
// Central state for the currently logged-in user.
// Listens to Firebase Auth in real-time so every component stays in sync.
// Usage: const auth = useAuthStore()
//        auth.user        → Firebase user object (or null)
//        auth.role        → 'admin' | 'student' | null
//        auth.isLoggedIn  → boolean

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthChange }  from '../firebase/auth'
import { getDocument }   from '../firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ───────────────────────────────────────────────────────────────
  const user       = ref(null)   // Firebase User object
  const role       = ref(null)   // 'admin' | 'student' | null
  const loading    = ref(true)   // true while we wait for Firebase to resolve

  // ─── Computed ────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin    = computed(() => role.value === 'admin')
  const isCoAdmin  = computed(() => role.value === 'co-admin')
  const isAnyAdmin = computed(() => role.value === 'admin' || role.value === 'co-admin')
  const isStudent  = computed(() => role.value === 'student')

  // ─── Actions ─────────────────────────────────────────────────────────────

  // Start listening to Firebase Auth state.
  // Called once in main.js — do NOT call in individual components.
  function init() {
    onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser
        // Fetch role from Firestore users/{uid}
        const profile = await getDocument('users', firebaseUser.uid)
        role.value = profile?.role ?? 'student'
      } else {
        // User signed out
        user.value = null
        role.value = null
      }
      loading.value = false // Firebase has resolved — hide splash screen
    })
  }

  // Manually clear state after sign-out
  function clearUser() {
    user.value    = null
    role.value    = null
    loading.value = false
  }

  return {
    user,
    role,
    loading,
    isLoggedIn,
    isAdmin,
    isCoAdmin,
    isAnyAdmin,
    isStudent,
    init,
    clearUser,
  }
})
