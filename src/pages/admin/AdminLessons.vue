<script setup>
// ─── AdminLessons ─────────────────────────────────────────────────────────────
// Lists all lessons for a course. Admin can create new, reorder (by editing order
// number), or delete lessons. Clicking Edit → AdminLessonEdit.

import { ref, onMounted }      from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db }                  from '../../firebase/config'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import AppSpinner from '../../components/ui/AppSpinner.vue'

const route   = useRoute()
const router  = useRouter()
const courseId = route.params.id

const lessons  = ref([])
const course   = ref(null)
const loading  = ref(true)
const creating = ref(false)

async function fetchData() {
  loading.value = true
  try {
    // Fetch course name for breadcrumb
    const { getDocument } = await import('../../firebase/firestore')
    course.value = await getDocument('courses', courseId)

    // Fetch all lessons (admin sees unpublished too — no isPublished filter)
    const snap = await getDocs(
      query(collection(db, `courses/${courseId}/lessons`), orderBy('order', 'asc'))
    )
    lessons.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

async function createLesson() {
  creating.value = true
  try {
    const nextOrder = lessons.value.length + 1
    const ref_ = await addDoc(collection(db, `courses/${courseId}/lessons`), {
      title:        `Day-${nextOrder} New Lesson`,
      order:        nextOrder,
      isPublished:  false,
      qaEnabled:    true,
      mainVideo:    { type: 'youtube', url: '', duration: 0 },
      resourceFiles: [],
      pdfs:          [],
      extraVideos:   [],
      communityLinks:[],
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    })
    router.push({ name: 'admin-lesson-edit', params: { id: courseId, lessonId: ref_.id } })
  } finally {
    creating.value = false
  }
}

async function deleteLesson(lessonId) {
  if (!confirm('Delete this lesson? This cannot be undone.')) return
  await deleteDoc(doc(db, `courses/${courseId}/lessons`, lessonId))
  await fetchData()
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Breadcrumb + header -->
    <div class="flex items-center gap-2 text-sm text-surface-400 mb-1">
      <RouterLink to="/admin/courses" class="hover:text-surface-700 transition-colors">Courses</RouterLink>
      <span>/</span>
      <span class="text-surface-700 font-medium truncate">{{ course?.title ?? 'Course' }}</span>
    </div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-surface-900">Lessons</h1>
      <div class="flex gap-2">
        <RouterLink :to="{ name: 'admin-course-edit', params: { id: courseId } }" class="btn-ghost text-sm border border-surface-200">
          ← Edit Course
        </RouterLink>
        <button @click="createLesson" :disabled="creating" class="btn-primary text-sm">
          <svg v-if="creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          + New Lesson
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <div v-else-if="lessons.length === 0" class="card p-12 text-center">
      <div class="text-5xl mb-4">📝</div>
      <p class="font-semibold text-surface-700 mb-1">No lessons yet</p>
      <p class="text-sm text-surface-400 mb-5">Add your first lesson to get started.</p>
      <button @click="createLesson" class="btn-primary">+ Create Lesson</button>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        class="card p-4 flex items-center gap-4"
      >
        <!-- Order number -->
        <div class="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
          <span class="font-bold text-primary-700 text-sm">{{ lesson.order }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-surface-900 text-sm">{{ lesson.title }}</p>
            <span
              class="badge text-xs"
              :class="lesson.isPublished ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'"
            >
              {{ lesson.isPublished ? 'Published' : 'Draft' }}
            </span>
          </div>
          <p class="text-xs text-surface-400 mt-0.5">
            {{ lesson.mainVideo?.type ?? '—' }}
            <span v-if="lesson.mainVideo?.duration"> · {{ lesson.mainVideo.duration }} min</span>
            <span v-if="lesson.extraVideos?.length"> · {{ lesson.extraVideos.length }} extra video(s)</span>
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <RouterLink
            :to="{ name: 'admin-lesson-edit', params: { id: courseId, lessonId: lesson.id } }"
            class="btn-secondary text-xs"
          >
            Edit
          </RouterLink>
          <button @click="deleteLesson(lesson.id)" class="btn-ghost text-xs text-red-500 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
