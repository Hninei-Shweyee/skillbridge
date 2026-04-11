<script setup>
// ─── AdminStudents ────────────────────────────────────────────────────────────
// Searchable table of all registered users.
// Admin can promote a user to admin or demote back to student.

import { ref, computed, onMounted } from 'vue'
import { db }                       from '../../firebase/config'
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { useAuthStore }             from '../../stores/authStore'
import AppSpinner from '../../components/ui/AppSpinner.vue'

const auth = useAuthStore()

const students  = ref([])
const loading   = ref(true)
const search    = ref('')
const updating  = ref(null) // uid of row being updated

onMounted(async () => {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  students.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  loading.value = false
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter(s =>
    s.displayName?.toLowerCase().includes(q) ||
    s.email?.toLowerCase().includes(q)
  )
})

async function changeRole(student, newRole) {
  if (!auth.isAdmin) return  // only main admin can change roles
  updating.value = student.id
  try {
    await updateDoc(doc(db, 'users', student.id), { role: newRole })
    student.role = newRole
  } finally {
    updating.value = null
  }
}

function formatDate(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Students</h1>
        <p class="text-sm text-surface-500 mt-0.5">{{ students.length }} registered users</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="search" type="text" class="input pl-10" placeholder="Search by name or email…" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-200 bg-surface-50">
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">User</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Role</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr v-for="student in filtered" :key="student.id" class="hover:bg-surface-50 transition-colors">
            <!-- User info -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                  {{ student.displayName?.charAt(0)?.toUpperCase() ?? student.email?.charAt(0)?.toUpperCase() ?? '?' }}
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-surface-900 truncate">{{ student.displayName || '—' }}</p>
                  <p class="text-xs text-surface-400 truncate">{{ student.email }}</p>
                </div>
              </div>
            </td>

            <!-- Joined date -->
            <td class="px-4 py-3 text-surface-500 text-xs hidden sm:table-cell">
              {{ formatDate(student.createdAt) }}
            </td>

            <!-- Role badge -->
            <td class="px-4 py-3">
              <span
                class="badge text-xs font-semibold"
                :class="{
                  'bg-purple-100 text-purple-700': student.role === 'admin',
                  'bg-blue-100 text-blue-700':     student.role === 'co-admin',
                  'bg-surface-100 text-surface-600': !student.role || student.role === 'student',
                }"
              >
                {{ student.role === 'admin' ? '👑 Main Admin' : student.role === 'co-admin' ? '🔑 Co-Admin' : 'Student' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right">
              <!-- Only main admin can change roles -->
              <select
                v-if="auth.isAdmin"
                :value="student.role ?? 'student'"
                :disabled="updating === student.id"
                @change="changeRole(student, $event.target.value)"
                class="input text-xs py-1 px-2 w-36"
              >
                <option value="student">Student</option>
                <option value="co-admin">Co-Admin</option>
                <option value="admin">Main Admin</option>
              </select>
              <span v-else class="text-xs text-surface-400">—</span>
            </td>
          </tr>

          <tr v-if="filtered.length === 0">
            <td colspan="4" class="px-4 py-10 text-center text-sm text-surface-400">
              No students found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
