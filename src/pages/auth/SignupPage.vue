<script setup>
// ─── SignupPage ───────────────────────────────────────────────────────────────
// New user registration.
// Steps:
//  1. Validate form fields client-side
//  2. Create Firebase Auth account
//  3. Write a user doc to Firestore users/{uid} with role: 'student'
//  4. Redirect to /dashboard

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signUpWithEmail, signInWithGoogle } from '../../firebase/auth'
import { setDocument, getDocument } from '../../firebase/firestore'

const router = useRouter()

// Form fields
const displayName = ref('')
const email       = ref('')
const password    = ref('')
const confirmPass = ref('')

// UI state
const loading       = ref(false)
const googleLoading = ref(false)
const errorMessage  = ref('')

// ─── Validation ───────────────────────────────────────────────────────────────
function validate() {
  if (!displayName.value.trim()) return 'Please enter your name.'
  if (!email.value.trim())       return 'Please enter your email.'
  if (password.value.length < 6) return 'Password must be at least 6 characters.'
  if (password.value !== confirmPass.value) return 'Passwords do not match.'
  return null
}

// ─── Create Firestore user document ──────────────────────────────────────────
async function createUserDoc(user) {
  await setDocument('users', user.uid, {
    uid:         user.uid,
    email:       user.email,
    displayName: user.displayName ?? displayName.value.trim(),
    photoURL:    user.photoURL ?? '',
    role:        'student', // default role — admin must be set manually in Firestore
  })
}

// ─── Email / Password Sign Up ─────────────────────────────────────────────────
async function handleSignup() {
  errorMessage.value = ''
  const err = validate()
  if (err) { errorMessage.value = err; return }

  loading.value = true
  try {
    const user = await signUpWithEmail(email.value.trim(), password.value, displayName.value.trim())
    await createUserDoc(user)
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = friendlyError(err.code)
  } finally {
    loading.value = false
  }
}

// ─── Google Sign Up ───────────────────────────────────────────────────────────
async function handleGoogleSignup() {
  errorMessage.value = ''
  googleLoading.value = true
  try {
    const user = await signInWithGoogle()
    // Only create user doc if it doesn't exist yet
    const existing = await getDocument('users', user.uid)
    if (!existing) await createUserDoc(user)
    router.push('/dashboard')
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      errorMessage.value = friendlyError(err.code)
    }
  } finally {
    googleLoading.value = false
  }
}

// ─── Friendly error messages ──────────────────────────────────────────────────
function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password is too weak. Use at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Heading -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-surface-900">Create your account</h2>
      <p class="text-surface-500 text-sm mt-1">Start your learning journey today. It's free.</p>
    </div>

    <!-- Google Sign-Up -->
    <button
      @click="handleGoogleSignup"
      :disabled="googleLoading || loading"
      class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-300 bg-white text-surface-700 font-medium text-sm hover:bg-surface-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
    >
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>{{ googleLoading ? 'Connecting…' : 'Sign up with Google' }}</span>
    </button>

    <!-- Divider -->
    <div class="flex items-center gap-3 mb-4">
      <div class="flex-1 h-px bg-surface-200"></div>
      <span class="text-xs text-surface-400">or sign up with email</span>
      <div class="flex-1 h-px bg-surface-200"></div>
    </div>

    <!-- Registration Form -->
    <form @submit.prevent="handleSignup" class="space-y-4">
      <!-- Full Name -->
      <div>
        <label for="name" class="label">Full name</label>
        <input
          id="name"
          v-model="displayName"
          type="text"
          autocomplete="name"
          placeholder="Mg Aung"
          class="input"
          :disabled="loading"
        />
      </div>

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
        <label for="password" class="label">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="Min. 6 characters"
          class="input"
          :disabled="loading"
        />
      </div>

      <!-- Confirm Password -->
      <div>
        <label for="confirm" class="label">Confirm password</label>
        <input
          id="confirm"
          v-model="confirmPass"
          type="password"
          autocomplete="new-password"
          placeholder="Re-enter password"
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
        {{ loading ? 'Creating account…' : 'Create Account' }}
      </button>

      <!-- Terms note -->
      <p class="text-xs text-surface-400 text-center leading-relaxed">
        By signing up, you agree to our terms of service and privacy policy.
      </p>
    </form>

    <!-- Login link -->
    <p class="mt-5 text-center text-sm text-surface-500">
      Already have an account?
      <RouterLink to="/login" class="text-primary-600 font-semibold hover:underline">
        Sign in
      </RouterLink>
    </p>
  </div>
</template>
