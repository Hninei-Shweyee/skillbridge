<script setup>
// ─── AdminDashboard ───────────────────────────────────────────────────────────
// Overview page with live stats: students, courses, enrollments, pending payments.

import { ref, onMounted } from 'vue'
import { db }             from '../../firebase/config'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import AppSpinner from '../../components/ui/AppSpinner.vue'

const loading = ref(true)
const stats   = ref({ students: 0, courses: 0, enrollments: 0, pendingPayments: 0 })

onMounted(async () => {
  try {
    const [s, c, e, p] = await Promise.all([
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'courses')),
      getCountFromServer(collection(db, 'enrollments')),
      getCountFromServer(query(collection(db, 'payments'), where('status', '==', 'submitted'))),
    ])
    stats.value = {
      students:        s.data().count,
      courses:         c.data().count,
      enrollments:     e.data().count,
      pendingPayments: p.data().count,
    }
  } finally {
    loading.value = false
  }
})

const cards = [
  { label: 'Total Students',    key: 'students',        icon: '👥', to: '/admin/students',         color: 'from-blue-500 to-blue-600' },
  { label: 'Total Courses',     key: 'courses',         icon: '🎓', to: '/admin/courses',           color: 'from-primary-500 to-primary-600' },
  { label: 'Total Enrollments', key: 'enrollments',     icon: '📋', to: '/admin/enrollments',       color: 'from-accent-500 to-accent-600' },
  { label: 'Pending Payments',  key: 'pendingPayments', icon: '💳', to: '/admin/payments',          color: 'from-amber-500 to-amber-600' },
]
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-surface-900">Dashboard</h1>
      <p class="text-sm text-surface-500 mt-0.5">SkillBridge platform overview</p>
    </div>

    <!-- Stats grid -->
    <div v-if="loading" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <RouterLink
        v-for="card in cards"
        :key="card.key"
        :to="card.to"
        class="rounded-2xl p-6 text-white hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-card relative"
        :class="`bg-gradient-to-br ${card.color}`"
      >
        <!-- Pending badge on the payment card -->
        <div v-if="card.key === 'pendingPayments' && stats.pendingPayments > 0"
          class="absolute top-3 right-3 w-5 h-5 rounded-full bg-white text-amber-600 text-xs font-bold flex items-center justify-center">
          !
        </div>
        <div class="text-3xl mb-3">{{ card.icon }}</div>
        <div class="text-3xl font-extrabold mb-1">{{ stats[card.key] }}</div>
        <div class="text-sm opacity-80">{{ card.label }}</div>
      </RouterLink>
    </div>

    <!-- Quick actions -->
    <div>
      <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RouterLink to="/admin/courses" class="card p-4 flex items-center gap-3 hover:shadow-card-lg transition-all group">
          <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl group-hover:bg-primary-100 transition-colors">🎓</div>
          <div>
            <p class="font-semibold text-surface-900 text-sm">Manage Courses</p>
            <p class="text-xs text-surface-400">Create and edit courses</p>
          </div>
          <svg class="w-4 h-4 text-surface-300 ml-auto group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </RouterLink>
        <RouterLink to="/admin/payments" class="card p-4 flex items-center gap-3 hover:shadow-card-lg transition-all group">
          <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl group-hover:bg-amber-100 transition-colors relative">
            💳
            <span v-if="stats.pendingPayments > 0"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
              {{ stats.pendingPayments > 9 ? '9+' : stats.pendingPayments }}
            </span>
          </div>
          <div>
            <p class="font-semibold text-surface-900 text-sm">Review Payments</p>
            <p class="text-xs text-surface-400">
              {{ stats.pendingPayments > 0 ? `${stats.pendingPayments} receipt${stats.pendingPayments > 1 ? 's' : ''} waiting` : 'No pending payments' }}
            </p>
          </div>
          <svg class="w-4 h-4 text-surface-300 ml-auto group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </RouterLink>
        <RouterLink to="/admin/enrollments" class="card p-4 flex items-center gap-3 hover:shadow-card-lg transition-all group">
          <div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-xl group-hover:bg-accent-100 transition-colors">📋</div>
          <div>
            <p class="font-semibold text-surface-900 text-sm">Manage Enrollments</p>
            <p class="text-xs text-surface-400">Enroll or suspend students</p>
          </div>
          <svg class="w-4 h-4 text-surface-300 ml-auto group-hover:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </RouterLink>
        <RouterLink to="/admin/settings/banking" class="card p-4 flex items-center gap-3 hover:shadow-card-lg transition-all group">
          <div class="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-xl group-hover:bg-surface-200 transition-colors">🏦</div>
          <div>
            <p class="font-semibold text-surface-900 text-sm">Banking Settings</p>
            <p class="text-xs text-surface-400">Manage payment accounts</p>
          </div>
          <svg class="w-4 h-4 text-surface-300 ml-auto group-hover:text-surface-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
