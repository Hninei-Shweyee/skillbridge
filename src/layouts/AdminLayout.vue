<script setup>
// ─── AdminLayout ──────────────────────────────────────────────────────────────
// Used by: all /admin/* pages.
// Structure: top navbar + left sidebar + main content area.
// The sidebar contains links to all admin sections.

import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { logOut } from '../firebase/auth'
import { useRouter } from 'vue-router'

const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()
const sidebarOpen = ref(false) // mobile sidebar toggle

const navItems = [
  { name: 'Dashboard',        to: '/admin/dashboard',        icon: '📊' },
  { name: 'Courses',          to: '/admin/courses',           icon: '🎓' },
  { name: 'Students',         to: '/admin/students',          icon: '👥' },
  { name: 'Enrollments',      to: '/admin/enrollments',       icon: '📋' },
  { name: 'Payments',         to: '/admin/payments',          icon: '💳' },
  { name: 'Testimonials',     to: '/admin/testimonials',      icon: '💬' },
  { name: 'Banking Settings', to: '/admin/settings/banking',  icon: '🏦' },
  { name: 'Blog & Vlogs',    to: '/admin/blog',              icon: '📝' },
]

const CO_ADMIN_ALLOWED = ['/admin/dashboard', '/admin/students', '/admin/enrollments', '/admin/payments']

const visibleNavItems = computed(() => {
  if (auth.isCoAdmin) return navItems.filter(item => CO_ADMIN_ALLOWED.includes(item.to))
  return navItems
})

async function handleLogout() {
  await logOut()
  router.push({ name: 'home' })
}

function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen bg-surface-100 overflow-hidden">

    <!-- ── Sidebar ───────────────────────────────────────────────────────── -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-64 bg-surface-900 flex flex-col transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Brand -->
      <div class="h-16 flex items-center px-6 border-b border-surface-800">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <span class="text-white font-bold text-xs">SB</span>
          </div>
          <span class="font-bold text-white text-sm">
            Skill<span class="text-primary-400">Bridge</span>
            <span class="text-surface-500 ml-1">Admin</span>
          </span>
        </RouterLink>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            isActive(item.to)
              ? 'bg-primary-600 text-white'
              : 'text-surface-400 hover:bg-surface-800 hover:text-white',
          ]"
        >
          <span class="text-base">{{ item.icon }}</span>
          {{ item.name }}
        </RouterLink>
      </nav>

      <!-- Bottom user area -->
      <div class="p-4 border-t border-surface-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-primary-200 font-semibold text-xs shrink-0">
            {{ auth.user?.displayName?.charAt(0)?.toUpperCase() ?? 'A' }}
          </div>
          <div class="text-sm overflow-hidden flex-1">
            <div class="text-white font-medium truncate">{{ auth.user?.displayName ?? 'Admin' }}</div>
            <div class="text-surface-500 text-xs truncate">{{ auth.user?.email }}</div>
          </div>
        </div>
        <!-- Role badge -->
        <div class="mb-3">
          <span class="text-xs px-2.5 py-1 rounded-full font-semibold"
            :class="auth.isAdmin ? 'bg-purple-700 text-purple-200' : 'bg-blue-800 text-blue-200'">
            {{ auth.isAdmin ? '👑 Main Admin' : '🔑 Co-Admin' }}
          </span>
        </div>
        <button @click="handleLogout" class="w-full text-left text-xs text-surface-500 hover:text-white transition-colors px-2 py-1 rounded">
          Sign Out →
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- ── Main Area ─────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header class="h-16 bg-white border-b border-surface-200 flex items-center px-6 gap-4 shrink-0">
        <!-- Mobile sidebar toggle -->
        <button class="lg:hidden btn-ghost p-2" @click="sidebarOpen = !sidebarOpen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <h1 class="font-semibold text-surface-900 text-sm flex-1">Admin Panel</h1>

        <RouterLink to="/" class="btn-ghost text-xs text-surface-500">
          ← View Site
        </RouterLink>
      </header>

      <!-- Page content scrolls independently -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
