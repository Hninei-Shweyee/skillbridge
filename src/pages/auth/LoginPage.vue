<script setup>
// ─── LoginPage ────────────────────────────────────────────────────────────────
// Allows existing users to sign in with email/password or Google.
// On success → redirects to /dashboard (or the page they were trying to visit).
// On error → shows a friendly error message below the form.

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signInWithEmail, signInWithGoogle } from '../../firebase/auth'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

// Form fields
const email    = ref('')
const password = ref('')

// UI state
const loading      = ref(false)
const googleLoading = ref(false)
const errorMessage = ref('')

// Where to go after login (supports ?redirect=/some/page)
const redirectTo = route.query.redirect || '/dashboard'

// ─── Email / Password Login ───────────────────────────────────────────────────
async function handleEmailLogin() {
  errorMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter your email and password.'
    return
  }
  loading.value = true
  try {
    await signInWithEmail(email.value.trim(), password.value)
    router.push(redirectTo)
  } catch (err) {
    errorMessage.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}

// ─── Google Login ─────────────────────────────────────────────────────────────
async function handleGoogleLogin() {
  errorMessage.value = ''
  googleLoading.value = true
  try {
    const user = await signInWithGoogle()
    // If first-time Google sign-in, create a user doc in Firestore
    await ensureUserDoc(user)
    router.push(redirectTo)
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      errorMessage.value = friendlyError(err.code)
    }
  } finally {
    googleLoading.value = false
  }
}

// Create a Firestore user doc if it doesn't exist yet (for Google sign-in)
async function ensureUserDoc(user) {
  const { getDocument, setDocument } = await import('../../firebase/firestore')
  const existing = await getDocument('users', user.uid)
  if (!existing) {
    await setDocument('users', user.uid, {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName ?? '',
      photoURL:    user.photoURL ?? '',
      role:        'student',
    })
  }
}

// ─── Map Firebase error codes to friendly messages ───────────────────────────
function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Heading -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-surface-900">Welcome back</h2>
      <p class="text-surface-500 text-sm mt-1">Sign in to continue learning.</p>
    </div>

    <!-- Google Sign-In -->
    <button
      @click="handleGoogleLogin"
      :disabled="googleLoading || loading"
      class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-300 bg-white text-surface-700 font-medium text-sm hover:bg-surface-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
    >
      <!-- Google SVG icon -->
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>{{ googleLoading ? 'Signing in…' : 'Continue with Google' }}</span>
    </button>

    <!-- Divider -->
    <div class="flex items-center gap-3 mb-4">
      <div class="flex-1 h-px bg-surface-200"></div>
      <span class="text-xs text-surface-400">or sign in with email</span>
      <div class="flex-1 h-px bg-surface-200"></div>
    </div>

    <!-- Email / Password Form -->
    <form @submit.prevent="handleEmailLogin" class="space-y-4">
      <!-- Email -->
      <div>
        <label for="email" class="label">Email address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          class="input"
          :disabled="loading"
        />
      </div>

      <!-- Password -->
      <div>
        <div class="flex justify-between items-center mb-1.5">
          <label for="password" class="label mb-0">Password</label>
          <!-- Forgot password — Phase 7 will wire this up -->
          <span class="text-xs text-primary-600 cursor-not-allowed opacity-50">Forgot password?</span>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          class="input"
          :disabled="loading"
        />
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
        <svg class="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        {{ errorMessage }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading || googleLoading"
        class="btn-primary w-full justify-center"
      >
        <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {{ loading ? 'Signing in…' : 'Sign In' }}
      </button>
    </form>

    <!-- Sign up link -->
    <p class="mt-5 text-center text-sm text-surface-500">
      Don't have an account?
      <RouterLink to="/signup" class="text-primary-600 font-semibold hover:underline">
        Create one free
      </RouterLink>
    </p>
  </div>
</template>
