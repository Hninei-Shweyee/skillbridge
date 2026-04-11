<script setup>
// ─── TheNavbar ────────────────────────────────────────────────────────────────
// Responsive top navigation bar used on all public and student pages.
// - Desktop: logo left, nav links center-right, auth buttons right
// - Mobile: hamburger menu triggers a slide-down drawer

import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { logOut } from '../../firebase/auth'

const router   = useRouter()
const auth     = useAuthStore()
const mobileOpen = ref(false) // controls mobile menu drawer

// Close mobile menu when route changes
router.afterEach(() => { mobileOpen.value = false })

async function handleLogout() {
  await logOut()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-200/80">
    <nav class="container-app flex items-center justify-between h-16">

      <!-- ── Logo ──────────────────────────────────────────────────────────── -->
      <RouterLink to="/" class="flex items-center gap-2 shrink-0">
        <!-- Simple text logo — replace with <img> once you have the real logo -->
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
          <span class="text-white font-bold text-sm">SB</span>
        </div>
        <span class="font-bold text-lg text-surface-900 tracking-tight">
          Skill<span class="text-primary-600">Bridge</span>
        </span>
      </RouterLink>

      <!-- ── Desktop Nav Links ──────────────────────────────────────────────── -->
      <ul class="hidden md:flex items-center gap-1">
        <li>
          <RouterLink
            to="/"
            class="btn-ghost text-sm"
            :class="{ 'text-primary-600 bg-primary-50': $route.path === '/' }"
          >
            Home
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/courses"
            class="btn-ghost text-sm"
            active-class="text-primary-600 bg-primary-50"
          >
            Courses
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/blog"
            class="btn-ghost text-sm"
            active-class="text-primary-600 bg-primary-50"
          >
            Blog
          </RouterLink>
        </li>
        <li v-if="auth.isLoggedIn">
          <RouterLink
            to="/dashboard"
            class="btn-ghost text-sm"
            active-class="text-primary-600 bg-primary-50"
          >
            My Learning
          </RouterLink>
        </li>
        <li v-if="auth.isAnyAdmin">
          <RouterLink
            to="/admin"
            class="btn-ghost text-sm"
            active-class="text-primary-600 bg-primary-50"
          >
            Admin
          </RouterLink>
        </li>
      </ul>

      <!-- ── Desktop Auth Buttons ───────────────────────────────────────────── -->
      <div class="hidden md:flex items-center gap-3">
        <template v-if="!auth.isLoggedIn">
          <RouterLink to="/login"  class="btn-ghost text-sm">Sign In</RouterLink>
          <RouterLink to="/signup" class="btn-primary text-sm">Get Started</RouterLink>
        </template>

        <template v-else>
          <!-- User avatar + name -->
          <div class="flex items-center gap-2 text-sm">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
              {{ auth.user?.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
            </div>
            <span class="text-surface-700 font-medium max-w-[120px] truncate">
              {{ auth.user?.displayName ?? auth.user?.email }}
            </span>
          </div>
          <button @click="handleLogout" class="btn-secondary text-sm">Sign Out</button>
        </template>
      </div>

      <!-- ── Mobile Hamburger ───────────────────────────────────────────────── -->
      <button
        class="md:hidden btn-ghost p-2"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
      >
        <!-- Hamburger / X icon -->
        <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </nav>

    <!-- ── Mobile Drawer ──────────────────────────────────────────────────── -->
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileOpen" class="md:hidden border-t border-surface-200 bg-white px-4 py-4 space-y-2">
        <RouterLink to="/"          class="block btn-ghost text-sm w-full text-left">Home</RouterLink>
        <RouterLink to="/courses"   class="block btn-ghost text-sm w-full text-left">Courses</RouterLink>
        <RouterLink to="/blog"      class="block btn-ghost text-sm w-full text-left">Blog</RouterLink>
        <RouterLink v-if="auth.isLoggedIn" to="/dashboard" class="block btn-ghost text-sm w-full text-left">My Learning</RouterLink>
        <RouterLink v-if="auth.isAnyAdmin" to="/admin"     class="block btn-ghost text-sm w-full text-left">Admin</RouterLink>

        <div class="pt-2 border-t border-surface-100">
          <template v-if="!auth.isLoggedIn">
            <RouterLink to="/login"  class="block btn-ghost text-sm w-full text-left mb-1">Sign In</RouterLink>
            <RouterLink to="/signup" class="block btn-primary text-sm w-full text-center">Get Started</RouterLink>
          </template>
          <template v-else>
            <div class="text-sm text-surface-500 px-3 pb-2">{{ auth.user?.email }}</div>
            <button @click="handleLogout" class="block btn-secondary text-sm w-full text-center">Sign Out</button>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>
