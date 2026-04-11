<script setup>
// ─── CourseDetailPage ─────────────────────────────────────────────────────────
// Shows full course info + lesson preview + testimonials.
// Enroll button behaviour:
//   guest                  → /signup
//   logged in, not enrolled → /payment/:courseId  (or active if free)
//   pending_payment         → /payment/:courseId (submit receipt)
//   payment_submitted       → /payment/:courseId/status
//   active                  → /dashboard/courses/:courseId

import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { useCourseStore }           from '../../stores/courseStore'
import { useAuthStore }             from '../../stores/authStore'
import { useEnrollment }            from '../../composables/useEnrollment'
import { useTestimonials }          from '../../composables/useTestimonials'
import AppSpinner                   from '../../components/ui/AppSpinner.vue'

const route       = useRoute()
const router      = useRouter()
const courseStore = useCourseStore()
const auth        = useAuthStore()
const { enroll, fetchEnrollmentStatus, enrolling } = useEnrollment()
const { testimonials, fetchTestimonials }          = useTestimonials()

const enrollmentStatus = ref(null)  // null | 'pending_payment' | 'payment_submitted' | 'active' | 'rejected' | 'suspended'
const enrollError      = ref('')

onMounted(async () => {
  await courseStore.fetchCourseBySlug(route.params.slug)
  if (courseStore.currentCourse) {
    const cid = courseStore.currentCourse.id
    await Promise.all([
      courseStore.fetchLessons(cid),
      fetchTestimonials(cid),
      auth.isLoggedIn
        ? fetchEnrollmentStatus(auth.user.uid, cid).then(e => { enrollmentStatus.value = e?.status ?? null })
        : Promise.resolve(),
    ])
  }
})

const course  = computed(() => courseStore.currentCourse)
const lessons = computed(() => courseStore.lessons)

const enrollLabel = computed(() => {
  if (!auth.isLoggedIn)                                 return 'Get Started →'
  if (enrolling.value)                                  return 'Processing…'
  if (enrollmentStatus.value === 'active')              return 'Continue Learning →'
  if (enrollmentStatus.value === 'payment_submitted')   return 'View Payment Status →'
  if (enrollmentStatus.value === 'pending_payment')     return 'Complete Payment →'
  if (enrollmentStatus.value === 'rejected')            return 'Retry Payment →'
  return course.value?.price === 0 ? 'Enroll Free →' : 'Enroll Now →'
})

const enrolledBadge = computed(() => {
  if (enrollmentStatus.value === 'active')            return { text: "You're enrolled", color: 'bg-success-500/20 border-success-500/30 text-success-400' }
  if (enrollmentStatus.value === 'payment_submitted') return { text: 'Payment under review', color: 'bg-amber-500/20 border-amber-400/30 text-amber-300' }
  if (enrollmentStatus.value === 'pending_payment')   return { text: 'Payment pending', color: 'bg-amber-500/20 border-amber-400/30 text-amber-300' }
  if (enrollmentStatus.value === 'rejected')          return { text: 'Payment rejected — retry', color: 'bg-red-500/20 border-red-400/30 text-red-300' }
  return null
})

async function handleEnroll() {
  enrollError.value = ''

  if (!auth.isLoggedIn) {
    router.push({ name: 'signup', query: { redirect: route.fullPath } })
    return
  }

  const cid = course.value.id

  if (enrollmentStatus.value === 'active') {
    router.push({ name: 'my-course', params: { courseId: cid } })
    return
  }

  if (enrollmentStatus.value === 'payment_submitted' || enrollmentStatus.value === 'pending_payment') {
    router.push({ name: 'payment-status', params: { courseId: cid } })
    return
  }

  if (enrollmentStatus.value === 'rejected') {
    router.push({ name: 'payment', params: { courseId: cid } })
    return
  }

  // New enrollment
  try {
    const result = await enroll(auth.user.uid, cid, course.value.price, course.value.currency)
    enrollmentStatus.value = result.status

    if (result.status === 'active') {
      router.push({ name: 'my-course', params: { courseId: cid } })
    } else {
      router.push({ name: 'payment', params: { courseId: cid } })
    }
  } catch {
    enrollError.value = 'Enrollment failed. Please try again.'
  }
}

function starArray(rating) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="courseStore.loading" class="flex justify-center items-center py-32">
      <AppSpinner size="lg" />
    </div>

    <!-- Course not found -->
    <div v-else-if="!course" class="section container-app text-center animate-fade-in">
      <div class="text-6xl mb-5">🔍</div>
      <h1 class="text-2xl font-bold text-surface-900 mb-3">Course not found</h1>
      <p class="text-surface-500 mb-6">This course doesn't exist or is not published yet.</p>
      <RouterLink to="/courses" class="btn-primary">← Back to Courses</RouterLink>
    </div>

    <!-- Course content -->
    <div v-else class="animate-fade-in">

      <!-- ── Hero banner ─────────────────────────────────────────────────── -->
      <div class="bg-surface-900 relative overflow-hidden">
        <div
          v-if="course.thumbnail"
          class="absolute inset-0 opacity-10 bg-cover bg-center blur-xl scale-110"
          :style="{ backgroundImage: `url(${course.thumbnail})` }"
        />
        <div class="relative z-10 container-app py-16">
          <div class="max-w-3xl">
            <nav class="flex items-center gap-2 text-xs text-surface-500 mb-6">
              <RouterLink to="/courses" class="hover:text-white transition-colors">Courses</RouterLink>
              <span>/</span>
              <span class="text-surface-300">{{ course.title }}</span>
            </nav>

            <p class="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">
              {{ course.instructor ?? 'SkillBridge' }}
            </p>
            <h1 class="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
              {{ course.title }}
            </h1>
            <p class="text-surface-300 text-lg leading-relaxed mb-8">
              {{ course.description }}
            </p>

            <!-- Meta row -->
            <div class="flex flex-wrap gap-5 text-sm text-surface-400 mb-8">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
                {{ course.totalLessons ?? lessons.length }} lessons
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
                </svg>
                Self-paced
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                </svg>
                Myanmar-friendly
              </span>
            </div>

            <!-- Enrollment status badge -->
            <div v-if="enrolledBadge"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium mb-5"
              :class="enrolledBadge.color"
            >
              {{ enrolledBadge.text }}
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <button
                @click="handleEnroll"
                :disabled="enrolling"
                class="btn-primary px-8 py-3 text-base shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg v-if="enrolling" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ enrollLabel }}
              </button>
              <div class="text-white font-bold text-lg">
                {{ course.price === 0 ? 'Free' : `${course.currency ?? 'MMK'} ${(course.price ?? 0).toLocaleString()}` }}
              </div>
            </div>

            <p v-if="enrollError" class="mt-3 text-sm text-red-400">{{ enrollError }}</p>
          </div>
        </div>
      </div>

      <!-- ── Main content ─────────────────────────────────────────────────── -->
      <div class="section container-app">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">

          <!-- Left: Lesson list + Testimonials -->
          <div class="lg:col-span-2 space-y-10">

            <!-- Course Content -->
            <div>
              <h2 class="text-xl font-bold text-surface-900 mb-5">Course Content</h2>

              <div v-if="courseStore.loading" class="flex justify-center py-8"><AppSpinner /></div>

              <div v-else-if="lessons.length > 0" class="space-y-2">
                <div
                  v-for="(lesson, index) in lessons"
                  :key="lesson.id"
                  class="flex items-center gap-4 p-4 rounded-xl border border-surface-200 bg-white"
                >
                  <div class="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                    <span class="text-primary-700 font-bold text-sm">{{ index + 1 }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-surface-900 text-sm truncate">{{ lesson.title }}</p>
                    <p v-if="lesson.mainVideo?.duration" class="text-xs text-surface-400 mt-0.5">
                      {{ lesson.mainVideo.duration }} min
                    </p>
                  </div>
                  <!-- Lock icon for non-enrolled -->
                  <svg v-if="enrollmentStatus !== 'active'" class="w-4 h-4 text-surface-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <svg v-else class="w-4 h-4 text-success-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>

              <div v-else class="card p-8 text-center">
                <p class="text-surface-400 text-sm">Lessons will appear here once the course is published.</p>
              </div>
            </div>

            <!-- Testimonials -->
            <div v-if="testimonials.length > 0">
              <h2 class="text-xl font-bold text-surface-900 mb-5">What Students Say</h2>

              <div class="space-y-4">
                <div v-for="t in testimonials" :key="t.id" class="card p-5">
                  <div class="flex items-start gap-3">
                    <!-- Avatar -->
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                      <img v-if="t.studentAvatar" :src="t.studentAvatar" class="w-full h-full object-cover" />
                      <span v-else>{{ t.studentName?.charAt(0)?.toUpperCase() }}</span>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="font-semibold text-surface-900 text-sm">{{ t.studentName }}</span>
                        <!-- Star rating -->
                        <div class="flex items-center gap-0.5">
                          <svg
                            v-for="(filled, i) in starArray(t.rating)"
                            :key="i"
                            class="w-3.5 h-3.5"
                            :class="filled ? 'text-amber-400' : 'text-surface-200'"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </div>
                      </div>
                      <p class="text-sm text-surface-600 leading-relaxed">{{ t.content }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right: Sticky enroll card -->
          <div class="lg:col-span-1">
            <div class="card p-6 sticky top-20">
              <div class="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary-900 to-accent-900 mb-5">
                <img
                  v-if="course.thumbnail"
                  :src="course.thumbnail"
                  :alt="course.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="text-5xl">🎓</span>
                </div>
              </div>

              <div class="text-3xl font-extrabold text-surface-900 mb-1">
                {{ course.price === 0 ? 'Free' : `${course.currency ?? 'MMK'} ${(course.price ?? 0).toLocaleString()}` }}
              </div>
              <p class="text-surface-400 text-xs mb-5">Lifetime access · All devices</p>

              <button
                @click="handleEnroll"
                :disabled="enrolling"
                class="btn-primary w-full justify-center py-3 text-base mb-4 disabled:opacity-60"
              >
                {{ enrollLabel }}
              </button>

              <ul class="space-y-2.5 text-sm text-surface-600">
                <li v-for="feat in ['recorded lessons', 'Downloadable resources & PDFs', 'Community & Q&A access', 'Learn on any device']" :key="feat"
                  class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-success-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ feat === 'recorded lessons' ? `${course.totalLessons ?? lessons.length} recorded lessons` : feat }}
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
