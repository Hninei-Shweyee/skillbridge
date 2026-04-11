<script setup>
// ─── MyCoursePage ─────────────────────────────────────────────────────────────
// Lists all lessons for an enrolled course.
// Each lesson shows: day number, title, duration, completion status.
// Clicking a lesson navigates to the lesson viewer.

import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore }      from '../../stores/courseStore'
import { useAuthStore }        from '../../stores/authStore'
import { useProgressStore }    from '../../stores/progressStore'
import { useEnrollment }       from '../../composables/useEnrollment'
import AppSpinner              from '../../components/ui/AppSpinner.vue'

const route       = useRoute()
const router      = useRouter()
const courseStore = useCourseStore()
const auth        = useAuthStore()
const progress    = useProgressStore()
const { isEnrolled } = useEnrollment()

const courseId = route.params.courseId

onMounted(async () => {
  // Guard: if not enrolled, redirect to the course detail page
  if (auth.user) {
    const enrolled = await isEnrolled(auth.user.uid, courseId)
    if (!enrolled) {
      router.replace({ name: 'courses' })
      return
    }
  }

  await courseStore.fetchCourse(courseId)
  await courseStore.fetchLessons(courseId)
  if (auth.user) {
    await progress.loadProgress(auth.user.uid, courseId)
  }
})

const course  = computed(() => courseStore.currentCourse)
const lessons = computed(() => courseStore.lessons)

// Total lessons count (use course field if available for accuracy)
const total = computed(() => course.value?.totalLessons ?? lessons.value.length)

function lessonStatus(lessonId) {
  if (progress.isCompleted(lessonId)) return 'completed'
  return 'available'
}

function goToLesson(lessonId) {
  router.push({ name: 'lesson-viewer', params: { courseId, lessonId } })
}

// Find the first lesson that isn't completed yet (resume point)
const resumeLessonId = computed(() => {
  return lessons.value.find(l => !progress.isCompleted(l.id))?.id ?? lessons.value[0]?.id
})
</script>

<template>
  <div class="section container-app animate-fade-in">

    <!-- Loading -->
    <div v-if="courseStore.loading" class="flex justify-center py-24">
      <AppSpinner size="lg" />
    </div>

    <div v-else-if="course">
      <!-- ── Course Header ─────────────────────────────────────────────────── -->
      <div class="mb-8">
        <!-- Back link -->
        <RouterLink to="/dashboard" class="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </RouterLink>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
              {{ course.instructor ?? 'SkillBridge' }}
            </p>
            <h1 class="page-title">{{ course.title }}</h1>
          </div>

          <!-- Resume button -->
          <button
            v-if="resumeLessonId"
            @click="goToLesson(resumeLessonId)"
            class="btn-primary shrink-0"
          >
            {{ progress.percentComplete > 0 ? 'Resume →' : 'Start Learning →' }}
          </button>
        </div>

        <!-- Overall progress bar -->
        <div class="mt-5 space-y-1.5">
          <div class="flex justify-between text-sm">
            <span class="text-surface-500">Overall progress</span>
            <span class="font-semibold text-surface-900">
              {{ progress.completedLessons.length }} / {{ total }} lessons · {{ progress.percentComplete }}%
            </span>
          </div>
          <div class="h-2 rounded-full bg-surface-200 overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700"
              :style="{ width: `${progress.percentComplete}%` }"
            />
          </div>
        </div>
      </div>

      <!-- ── Lesson List ─────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <h2 class="text-base font-bold text-surface-700 uppercase tracking-wide text-xs mb-4">
          Course Lessons
        </h2>

        <button
          v-for="(lesson, index) in lessons"
          :key="lesson.id"
          @click="goToLesson(lesson.id)"
          class="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 group"
          :class="{
            'border-success-500/30 bg-success-500/5 hover:bg-success-500/10':
              lessonStatus(lesson.id) === 'completed',
            'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-card':
              lessonStatus(lesson.id) !== 'completed',
          }"
        >
          <!-- Status icon / day number -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            :class="{
              'bg-success-500 text-white': lessonStatus(lesson.id) === 'completed',
              'bg-primary-50 border border-primary-100 text-primary-700 group-hover:bg-primary-100': lessonStatus(lesson.id) !== 'completed',
            }"
          >
            <!-- Checkmark if completed -->
            <svg v-if="lessonStatus(lesson.id) === 'completed'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <!-- Day number otherwise -->
            <span v-else class="font-bold text-sm">{{ index + 1 }}</span>
          </div>

          <!-- Lesson info -->
          <div class="flex-1 min-w-0">
            <p
              class="font-semibold text-sm transition-colors"
              :class="{
                'text-success-700': lessonStatus(lesson.id) === 'completed',
                'text-surface-900 group-hover:text-primary-700': lessonStatus(lesson.id) !== 'completed',
              }"
            >
              {{ lesson.title }}
            </p>
            <div class="flex items-center gap-3 mt-0.5">
              <span v-if="lesson.mainVideo?.duration" class="text-xs text-surface-400 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
                </svg>
                {{ lesson.mainVideo.duration }} min
              </span>
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="{
                  'bg-success-100 text-success-700': lessonStatus(lesson.id) === 'completed',
                  'bg-surface-100 text-surface-500': lessonStatus(lesson.id) === 'available',
                }"
              >
                {{ lessonStatus(lesson.id) === 'completed' ? 'Completed' : 'Available' }}
              </span>
            </div>
          </div>

          <!-- Arrow -->
          <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Course not found -->
    <div v-else class="text-center py-24">
      <p class="text-surface-400">Course not found.</p>
      <RouterLink to="/dashboard" class="btn-primary mt-4 inline-block">← Dashboard</RouterLink>
    </div>

  </div>
</template>
