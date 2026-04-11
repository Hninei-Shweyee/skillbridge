<script setup>
// ─── DashboardPage ────────────────────────────────────────────────────────────
// Student's home base. Shows all enrollments including pending-payment ones
// with appropriate badges.

import { computed, onMounted } from 'vue'
import { useAuthStore }        from '../../stores/authStore'
import { useEnrollment }       from '../../composables/useEnrollment'
import { useProgressStore }    from '../../stores/progressStore'
import AppSpinner              from '../../components/ui/AppSpinner.vue'

const auth     = useAuthStore()
const progress = useProgressStore()
const { enrollments, loading, fetchMyEnrollments } = useEnrollment()

onMounted(async () => {
  if (auth.user) {
    await fetchMyEnrollments(auth.user.uid)
    for (const enrollment of enrollments.value) {
      if (enrollment.status === 'active') {
        await progress.loadProgress(auth.user.uid, enrollment.courseId)
      }
    }
  }
})

const activeEnrollments  = computed(() => enrollments.value.filter(e => e.status === 'active'))
const pendingEnrollments = computed(() => enrollments.value.filter(e =>
  e.status === 'pending_payment' || e.status === 'payment_submitted'
))

function getCourseProgress(courseId) {
  return progress.percentComplete ?? 0
}

function statusLabel(status) {
  return {
    pending_payment:   'Payment Pending',
    payment_submitted: 'Under Review',
    rejected:          'Payment Rejected',
    suspended:         'Suspended',
  }[status] ?? ''
}

function statusClass(status) {
  return {
    pending_payment:   'bg-amber-100 text-amber-700',
    payment_submitted: 'bg-amber-100 text-amber-700',
    rejected:          'bg-red-100 text-red-700',
    suspended:         'bg-surface-100 text-surface-500',
  }[status] ?? ''
}
</script>

<template>
  <div class="section container-app animate-fade-in">

    <!-- ── Welcome Banner ─────────────────────────────────────────────────── -->
    <div class="rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 p-8 mb-10 text-white">
      <p class="text-primary-200 text-sm font-medium mb-1">Welcome back 👋</p>
      <h1 class="text-3xl font-extrabold mb-1 tracking-tight">
        {{ auth.user?.displayName ?? 'Learner' }}
      </h1>
      <p class="text-primary-200 text-sm">
        {{ activeEnrollments.length > 0
          ? `You're enrolled in ${activeEnrollments.length} course${activeEnrollments.length > 1 ? 's' : ''}. Keep going!`
          : 'Ready to start learning? Enroll in your first course below.' }}
      </p>
    </div>

    <!-- ── Pending payments notice ────────────────────────────────────────── -->
    <div v-if="pendingEnrollments.length > 0" class="rounded-2xl bg-amber-50 border border-amber-200 p-5 mb-8">
      <div class="flex items-start gap-3">
        <span class="text-2xl mt-0.5">⏳</span>
        <div>
          <p class="font-semibold text-amber-800 text-sm">
            {{ pendingEnrollments.length === 1 ? '1 payment' : `${pendingEnrollments.length} payments` }} waiting for review
          </p>
          <p class="text-amber-600 text-xs mt-0.5">
            Your payment receipt has been received. Our team will verify and grant access soon.
          </p>
          <div class="flex flex-wrap gap-2 mt-3">
            <RouterLink
              v-for="e in pendingEnrollments"
              :key="e.id"
              :to="{ name: 'payment-status', params: { courseId: e.courseId } }"
              class="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              {{ e.course?.title ?? 'View Status' }} →
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- ── My Courses ─────────────────────────────────────────────────────── -->
    <div>
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-xl font-bold text-surface-900">My Courses</h2>
        <RouterLink to="/courses" class="text-sm text-primary-600 font-medium hover:underline">
          Browse more →
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <AppSpinner size="lg" />
      </div>

      <!-- Courses grid (all statuses) -->
      <div v-else-if="enrollments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <component
          :is="enrollment.status === 'active' ? 'RouterLink' : 'div'"
          v-for="enrollment in enrollments"
          :key="enrollment.id"
          :to="enrollment.status === 'active' ? { name: 'my-course', params: { courseId: enrollment.courseId } } : undefined"
          class="card group overflow-hidden transition-all duration-200"
          :class="enrollment.status === 'active' ? 'hover:shadow-card-lg hover:-translate-y-1 cursor-pointer' : 'cursor-default'"
        >
          <!-- Thumbnail -->
          <div class="aspect-video bg-gradient-to-br from-primary-900 to-accent-900 relative overflow-hidden">
            <img
              v-if="enrollment.course?.thumbnail"
              :src="enrollment.course.thumbnail"
              :alt="enrollment.course.title"
              class="w-full h-full object-cover"
              :class="enrollment.status === 'active' ? 'group-hover:scale-105 transition-transform duration-300' : 'opacity-70'"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-4xl">🎓</span>
            </div>

            <!-- Pending overlay -->
            <div v-if="enrollment.status !== 'active'" class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span
                class="text-xs font-bold px-3 py-1.5 rounded-full"
                :class="statusClass(enrollment.status)"
              >
                {{ statusLabel(enrollment.status) }}
              </span>
            </div>
          </div>

          <!-- Card body -->
          <div class="p-5">
            <p class="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">
              {{ enrollment.course?.instructor ?? 'SkillBridge' }}
            </p>
            <h3 class="font-bold text-surface-900 text-sm leading-snug mb-3 line-clamp-2"
              :class="enrollment.status === 'active' ? 'group-hover:text-primary-700 transition-colors' : ''">
              {{ enrollment.course?.title ?? 'Course' }}
            </h3>

            <!-- Active: show progress -->
            <template v-if="enrollment.status === 'active'">
              <div class="space-y-1.5">
                <div class="flex justify-between text-xs text-surface-500">
                  <span>Progress</span>
                  <span class="font-medium text-surface-700">{{ getCourseProgress(enrollment.courseId) }}%</span>
                </div>
                <div class="h-1.5 rounded-full bg-surface-200 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                    :style="{ width: `${getCourseProgress(enrollment.courseId)}%` }"
                  />
                </div>
              </div>
              <div class="mt-4 pt-4 border-t border-surface-100">
                <span class="text-xs font-semibold text-primary-600 group-hover:underline">
                  {{ getCourseProgress(enrollment.courseId) > 0 ? 'Continue Learning →' : 'Start Learning →' }}
                </span>
              </div>
            </template>

            <!-- Pending: show action button -->
            <template v-else>
              <RouterLink
                :to="enrollment.status === 'pending_payment'
                  ? { name: 'payment', params: { courseId: enrollment.courseId } }
                  : { name: 'payment-status', params: { courseId: enrollment.courseId } }"
                class="mt-2 block text-center text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors"
              >
                {{ enrollment.status === 'pending_payment' ? 'Upload Receipt →' : 'View Payment Status →' }}
              </RouterLink>
            </template>
          </div>
        </component>
      </div>

      <!-- Empty state -->
      <div v-else class="card p-12 text-center">
        <div class="text-6xl mb-5">🎓</div>
        <h3 class="font-semibold text-surface-900 mb-2">No courses yet</h3>
        <p class="text-surface-500 text-sm mb-6 max-w-xs mx-auto">
          Enroll in a course to start tracking your progress here.
        </p>
        <RouterLink to="/courses" class="btn-primary">Browse Courses</RouterLink>
      </div>
    </div>

  </div>
</template>
