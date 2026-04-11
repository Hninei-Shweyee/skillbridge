<script setup>
// ─── LessonViewerPage ─────────────────────────────────────────────────────────
// The core learning experience. Layout:
//   Left (2/3):  video → resources → PDFs → extra videos → Q&A → community → tools
//   Right (1/3): lesson list sidebar (sticky) with progress
//
// Actions:
//   - "Mark as Complete" writes to Firestore and updates the progress bar
//   - Previous / Next buttons navigate between lessons
//   - Sidebar lesson items are clickable for direct navigation

import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter }             from 'vue-router'
import { useCourseStore }                  from '../../stores/courseStore'
import { useAuthStore }                    from '../../stores/authStore'
import { useProgressStore }               from '../../stores/progressStore'
import VideoPlayer                         from '../../components/lesson/VideoPlayer.vue'
import ResourceList                        from '../../components/lesson/ResourceList.vue'
import PdfList                             from '../../components/lesson/PdfList.vue'
import ExtraVideos                         from '../../components/lesson/ExtraVideos.vue'
import QASection                           from '../../components/lesson/QASection.vue'
import CommunityLinks                      from '../../components/lesson/CommunityLinks.vue'
import AppSpinner                          from '../../components/ui/AppSpinner.vue'
import { getDocument }                     from '../../firebase/firestore'

const route       = useRoute()
const router      = useRouter()
const courseStore = useCourseStore()
const auth        = useAuthStore()
const progress    = useProgressStore()

const lesson          = ref(null)
const lessonLoading   = ref(true)
const markingComplete = ref(false)
const sidebarOpen     = ref(false) // mobile sidebar toggle

const courseId = computed(() => route.params.courseId)
const lessonId = computed(() => route.params.lessonId)

// ─── Load lesson + course data ────────────────────────────────────────────────
async function loadLesson() {
  lessonLoading.value = true
  try {
    // Fetch the lesson doc from the subcollection
    lesson.value = await getDocument(
      `courses/${courseId.value}/lessons`,
      lessonId.value
    )
    // Fetch course + lesson list if not already loaded (for sidebar)
    if (!courseStore.currentCourse || courseStore.currentCourse.id !== courseId.value) {
      await courseStore.fetchCourse(courseId.value)
    }
    if (courseStore.lessons.length === 0) {
      await courseStore.fetchLessons(courseId.value)
    }
    // Load progress
    if (auth.user) {
      await progress.loadProgress(auth.user.uid, courseId.value)
    }
  } finally {
    lessonLoading.value = false
  }
}

onMounted(loadLesson)

// Reload when navigating between lessons (route params change)
watch(lessonId, loadLesson)

// ─── Lesson navigation ────────────────────────────────────────────────────────
const lessons        = computed(() => courseStore.lessons)
const currentIndex   = computed(() => lessons.value.findIndex(l => l.id === lessonId.value))
const prevLesson     = computed(() => lessons.value[currentIndex.value - 1] ?? null)
const nextLesson     = computed(() => lessons.value[currentIndex.value + 1] ?? null)
const isLastLesson   = computed(() => currentIndex.value === lessons.value.length - 1)
const isCompleted    = computed(() => progress.isCompleted(lessonId.value))
const totalLessons   = computed(() => courseStore.currentCourse?.totalLessons ?? lessons.value.length)

function goToLesson(id) {
  router.push({ name: 'lesson-viewer', params: { courseId: courseId.value, lessonId: id } })
  sidebarOpen.value = false
}

// ─── Mark lesson as complete ─────────────────────────────────────────────────
async function markComplete() {
  if (isCompleted.value || markingComplete.value || !auth.user) return
  markingComplete.value = true
  try {
    await progress.markComplete(
      auth.user.uid,
      courseId.value,
      lessonId.value,
      totalLessons.value
    )
    // Auto-advance to next lesson after 1.2s so the user sees the completion state
    if (nextLesson.value) {
      setTimeout(() => goToLesson(nextLesson.value.id), 1200)
    }
  } finally {
    markingComplete.value = false
  }
}

// ─── Lesson status helper for sidebar ────────────────────────────────────────
function lessonSidebarStatus(id) {
  if (id === lessonId.value)         return 'current'
  if (progress.isCompleted(id))      return 'completed'
  return 'available'
}
</script>

<template>
  <div class="min-h-screen bg-surface-50">

    <!-- ── Top bar ────────────────────────────────────────────────────────── -->
    <div class="sticky top-0 z-30 bg-white border-b border-surface-200 h-14 flex items-center px-4 gap-3">
      <!-- Back to my course -->
      <RouterLink
        :to="{ name: 'my-course', params: { courseId } }"
        class="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors shrink-0"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="hidden sm:inline">{{ courseStore.currentCourse?.title ?? 'Course' }}</span>
        <span class="sm:hidden">Back</span>
      </RouterLink>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-surface-900 truncate">
          {{ lesson?.title ?? '' }}
        </p>
      </div>

      <!-- Progress indicator -->
      <div class="hidden sm:flex items-center gap-2 text-xs text-surface-500 shrink-0">
        <span>{{ progress.completedLessons.length }}/{{ totalLessons }}</span>
        <div class="w-20 h-1.5 rounded-full bg-surface-200 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
            :style="{ width: `${progress.percentComplete}%` }"
          />
        </div>
        <span class="font-medium text-surface-700">{{ progress.percentComplete }}%</span>
      </div>

      <!-- Mobile sidebar toggle -->
      <button
        class="sm:hidden btn-ghost p-2 shrink-0"
        @click="sidebarOpen = !sidebarOpen"
        aria-label="Toggle lesson list"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────────── -->
    <div v-if="lessonLoading" class="flex justify-center items-center py-32">
      <AppSpinner size="lg" />
    </div>

    <!-- ── Main Layout ────────────────────────────────────────────────────── -->
    <div v-else class="flex">

      <!-- ════ LEFT: Content Area ════════════════════════════════════════ -->
      <main class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-4xl">

        <!-- Mobile sidebar overlay -->
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-20 bg-black/40 sm:hidden"
          @click="sidebarOpen = false"
        />

        <!-- ── Section 1: Main Video ──────────────────────────────────── -->
        <section class="mb-8">
          <VideoPlayer :video="lesson?.mainVideo ?? {}" />

          <!-- Lesson title + complete button -->
          <div class="mt-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-xs text-surface-400 mb-1">
                <span>Day {{ (currentIndex + 1) }}</span>
                <span>·</span>
                <span v-if="lesson?.mainVideo?.duration">{{ lesson.mainVideo.duration }} min</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-bold text-surface-900 leading-tight">
                {{ lesson?.title }}
              </h1>
            </div>

            <!-- Mark Complete button -->
            <button
              @click="markComplete"
              :disabled="isCompleted || markingComplete"
              class="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              :class="isCompleted
                ? 'bg-success-500 text-white cursor-default'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:opacity-60'"
            >
              <svg v-if="markingComplete" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <svg v-else-if="isCompleted" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ isCompleted ? 'Completed!' : markingComplete ? 'Saving…' : 'Mark as Complete' }}
            </button>
          </div>
        </section>

        <!-- Divider -->
        <hr class="border-surface-200 mb-8" />

        <!-- ── Section 2: Resource Files ─────────────────────────────── -->
        <section v-if="lesson?.resourceFiles?.length" class="mb-8">
          <ResourceList :files="lesson.resourceFiles" />
        </section>

        <!-- ── Section 3: PDFs ───────────────────────────────────────── -->
        <section v-if="lesson?.pdfs?.length" class="mb-8">
          <PdfList :pdfs="lesson.pdfs" />
        </section>

        <!-- Divider between files and extra videos -->
        <hr v-if="lesson?.resourceFiles?.length || lesson?.pdfs?.length" class="border-surface-200 mb-8" />

        <!-- ── Section 4: Extra Resource Videos ──────────────────────── -->
        <section class="mb-8">
          <ExtraVideos :videos="lesson?.extraVideos ?? []" />
        </section>

        <hr class="border-surface-200 mb-8" />

        <!-- ── Section 5: Q&A ────────────────────────────────────────── -->
        <section class="mb-8">
          <QASection
            :lesson-id="lessonId"
            :qa-enabled="lesson?.qaEnabled ?? true"
            :qa-url="lesson?.qaUrl ?? ''"
          />
        </section>

        <!-- ── Section 6: Community Links ────────────────────────────── -->
        <section class="mb-8">
          <CommunityLinks :links="lesson?.communityLinks ?? []" />
        </section>


        <!-- ── Prev / Next Navigation ─────────────────────────────────── -->
        <div class="flex items-center justify-between gap-4 pt-6 border-t border-surface-200">
          <!-- Previous lesson -->
          <button
            v-if="prevLesson"
            @click="goToLesson(prevLesson.id)"
            class="flex items-center gap-2 btn-secondary text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            <span class="max-w-[160px] truncate">{{ prevLesson.title }}</span>
          </button>
          <div v-else />

          <!-- Next lesson / course complete -->
          <button
            v-if="nextLesson"
            @click="goToLesson(nextLesson.id)"
            class="flex items-center gap-2 btn-primary text-sm ml-auto"
          >
            <span class="max-w-[160px] truncate">{{ nextLesson.title }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <!-- All done -->
          <div v-else-if="isLastLesson" class="ml-auto flex items-center gap-2 text-success-600 font-semibold text-sm">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Course Complete! 🎉
          </div>
        </div>

      </main>

      <!-- ════ RIGHT: Lesson Sidebar ═════════════════════════════════════ -->
      <aside
        :class="[
          'w-72 shrink-0 border-l border-surface-200 bg-white',
          'hidden lg:block', // always visible on large screens
          // Mobile: slide in over content
          sidebarOpen
            ? 'fixed right-0 top-14 bottom-0 z-30 flex flex-col shadow-xl sm:flex'
            : 'sm:hidden lg:flex flex-col',
        ]"
        class="flex flex-col"
      >
        <div class="p-4 border-b border-surface-100">
          <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Lessons</p>
          <!-- Progress mini bar -->
          <div class="mt-2 flex items-center gap-2 text-xs text-surface-500">
            <div class="flex-1 h-1.5 rounded-full bg-surface-200 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                :style="{ width: `${progress.percentComplete}%` }"
              />
            </div>
            <span>{{ progress.percentComplete }}%</span>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-2">
          <button
            v-for="(l, index) in lessons"
            :key="l.id"
            @click="goToLesson(l.id)"
            class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
            :class="{
              'bg-primary-50 border-r-2 border-primary-600': lessonSidebarStatus(l.id) === 'current',
              'hover:bg-surface-50':                         lessonSidebarStatus(l.id) !== 'current',
            }"
          >
            <!-- Status dot / check -->
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              :class="{
                'bg-primary-600 text-white':  lessonSidebarStatus(l.id) === 'current',
                'bg-success-500 text-white':  lessonSidebarStatus(l.id) === 'completed',
                'bg-surface-100 text-surface-500': lessonSidebarStatus(l.id) === 'available',
              }"
            >
              <svg v-if="lessonSidebarStatus(l.id) === 'completed'" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <p
                class="text-xs font-medium leading-snug line-clamp-2"
                :class="{
                  'text-primary-700': lessonSidebarStatus(l.id) === 'current',
                  'text-success-700': lessonSidebarStatus(l.id) === 'completed',
                  'text-surface-700': lessonSidebarStatus(l.id) === 'available',
                }"
              >
                {{ l.title }}
              </p>
              <p v-if="l.mainVideo?.duration" class="text-xs text-surface-400 mt-0.5">
                {{ l.mainVideo.duration }} min
              </p>
            </div>
          </button>
        </nav>
      </aside>
    </div>
  </div>
</template>
