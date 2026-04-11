<script setup>
// ─── AdminEnrollments ─────────────────────────────────────────────────────────
// View all enrollments. Admin can:
//   - Manually enroll any student in any course
//   - Suspend or reactivate an enrollment

import { ref, computed, onMounted } from 'vue'
import { db }                       from '../../firebase/config'
import {
  collection, getDocs, addDoc, doc, updateDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import AppSpinner from '../../components/ui/AppSpinner.vue'

const enrollments = ref([])
const students    = ref([])
const courses     = ref([])
const loading     = ref(true)
const search      = ref('')
const updating    = ref(null)
const openMenu    = ref(null)  // enrollment id whose dropdown is open

// Manual enrollment form
const showForm   = ref(false)
const newStudentId = ref('')
const newCourseId  = ref('')
const enrolling    = ref(false)
const enrollMsg    = ref('')

onMounted(async () => {
  await Promise.all([fetchEnrollments(), fetchStudents(), fetchCourses()])
  loading.value = false
})

async function fetchEnrollments() {
  const snap = await getDocs(
    query(collection(db, 'enrollments'), orderBy('enrolledAt', 'desc'))
  )
  enrollments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function fetchStudents() {
  const snap = await getDocs(collection(db, 'users'))
  students.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function fetchCourses() {
  const snap = await getDocs(collection(db, 'courses'))
  courses.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Enrich enrollment with student + course names for display
const enriched = computed(() => {
  return enrollments.value.map(e => ({
    ...e,
    student: students.value.find(s => s.id === e.studentId),
    course:  courses.value.find(c => c.id === e.courseId),
  }))
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return enriched.value
  return enriched.value.filter(e =>
    e.student?.displayName?.toLowerCase().includes(q) ||
    e.student?.email?.toLowerCase().includes(q) ||
    e.course?.title?.toLowerCase().includes(q)
  )
})

async function toggleStatus(enrollment) {
  updating.value = enrollment.id
  // active → suspended; anything else → active
  const newStatus = enrollment.status === 'active' ? 'suspended' : 'active'
  try {
    await updateDoc(doc(db, 'enrollments', enrollment.id), { status: newStatus })
    enrollment.status = newStatus
  } finally {
    updating.value = null
  }
}

async function manualEnroll() {
  if (!newStudentId.value || !newCourseId.value) {
    enrollMsg.value = 'Please select a student and a course.'
    return
  }
  enrolling.value = true
  enrollMsg.value = ''
  try {
    await addDoc(collection(db, 'enrollments'), {
      studentId:  newStudentId.value,
      courseId:   newCourseId.value,
      enrolledAt: serverTimestamp(),
      status:     'active',
      paymentId:  null,
      enrolledBy: 'admin',
    })
    showForm.value     = false
    newStudentId.value = ''
    newCourseId.value  = ''
    await fetchEnrollments()
  } catch {
    enrollMsg.value = 'Enrollment failed. Please try again.'
  } finally {
    enrolling.value = false
  }
}

function formatDate(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Enrollments</h1>
        <p class="text-sm text-surface-500 mt-0.5">{{ enrollments.length }} total enrollments</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="search" type="text" class="input pl-10" placeholder="Search by student or course…" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <!-- Table -->
    <div v-else class="card overflow-hidden" @click="openMenu = null">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-200 bg-surface-50">
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Student</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden md:table-cell">Course</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden sm:table-cell">Enrolled</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr v-for="e in filtered" :key="e.id" class="hover:bg-surface-50 transition-colors">
            <td class="px-4 py-3">
              <p class="font-semibold text-surface-900 truncate max-w-[140px]">
                {{ e.student?.displayName || e.student?.email || e.studentId }}
              </p>
              <p class="text-xs text-surface-400 truncate max-w-[140px]">{{ e.student?.email ?? '' }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-surface-700 text-xs max-w-[180px] truncate">
              {{ e.course?.title ?? e.courseId }}
            </td>
            <td class="px-4 py-3 text-surface-500 text-xs hidden sm:table-cell">
              {{ formatDate(e.enrolledAt) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap border"
                :class="{
                  'bg-green-100 text-green-800 border-green-300':   e.status === 'active',
                  'bg-red-100 text-red-800 border-red-300':         e.status === 'suspended',
                  'bg-rose-100 text-rose-800 border-rose-300':      e.status === 'rejected',
                  'bg-amber-100 text-amber-800 border-amber-300':   e.status === 'payment_submitted',
                  'bg-yellow-100 text-yellow-800 border-yellow-300':e.status === 'pending_payment',
                  'bg-surface-100 text-surface-500 border-surface-200': !e.status,
                }"
              >
                <!-- Dot indicator -->
                <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="{
                    'bg-green-600':   e.status === 'active',
                    'bg-red-600':     e.status === 'suspended',
                    'bg-rose-600':    e.status === 'rejected',
                    'bg-amber-600':   e.status === 'payment_submitted',
                    'bg-yellow-600':  e.status === 'pending_payment',
                    'bg-surface-400': !e.status,
                  }"
                />
                {{ {
                  active:            'Active',
                  suspended:         'Suspended',
                  rejected:          'Rejected',
                  payment_submitted: 'Under Review',
                  pending_payment:   'Pending Payment',
                }[e.status] ?? e.status ?? 'Active' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="relative flex justify-center">
                <!-- Three-dot button -->
                <button
                  @click.stop="openMenu = openMenu === e.id ? null : e.id"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </button>

                <!-- Dropdown -->
                <div
                  v-if="openMenu === e.id"
                  class="absolute right-0 top-9 z-30 w-44 bg-white rounded-xl shadow-lg border border-surface-200 py-1 text-sm"
                >
                  <!-- Activate -->
                  <button
                    v-if="e.status !== 'active'"
                    @click="toggleStatus(e); openMenu = null"
                    :disabled="updating === e.id"
                    class="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-green-50 text-green-700 font-medium transition-colors disabled:opacity-40"
                  >
                    <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                    {{ updating === e.id ? 'Activating…' : 'Activate' }}
                  </button>

                  <!-- Suspend -->
                  <button
                    v-if="e.status === 'active'"
                    @click="toggleStatus(e); openMenu = null"
                    :disabled="updating === e.id"
                    class="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-red-50 text-red-600 font-medium transition-colors disabled:opacity-40"
                  >
                    <span class="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    {{ updating === e.id ? 'Suspending…' : 'Suspend' }}
                  </button>

                  <!-- View Payment -->
                  <RouterLink
                    v-if="e.status === 'payment_submitted' || e.status === 'pending_payment'"
                    :to="{ name: 'admin-payments' }"
                    @click="openMenu = null"
                    class="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-amber-50 text-amber-700 font-medium transition-colors"
                  >
                    <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                    View Payment
                  </RouterLink>

                </div>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-surface-400">
              No enrollments found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
