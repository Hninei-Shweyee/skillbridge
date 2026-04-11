<script setup>
// ─── AdminCourses ─────────────────────────────────────────────────────────────
// Lists all courses (published + draft). Admin can create new or delete existing.
// Clicking a course → AdminCourseEdit. Lessons button → AdminLessons.

import { ref, onMounted }   from 'vue'
import { useRouter }         from 'vue-router'
import { db }                from '../../firebase/config'
import {
  collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import AppSpinner from '../../components/ui/AppSpinner.vue'

const router  = useRouter()
const courses = ref([])
const loading = ref(true)
const creating = ref(false)

async function fetchCourses() {
  loading.value = true
  try {
    const snap = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc')))
    courses.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
}

onMounted(fetchCourses)

// Create a blank course then redirect to edit page
async function createCourse() {
  creating.value = true
  try {
    const ref_ = await addDoc(collection(db, 'courses'), {
      title:        'New Course',
      slug:         `course-${Date.now()}`,
      description:  '',
      instructor:   'SkillBridge',
      price:        0,
      currency:     'MMK',
      isPublished:  false,
      totalLessons: 0,
      thumbnail:    '',
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    })
    router.push({ name: 'admin-course-edit', params: { id: ref_.id } })
  } finally {
    creating.value = false
  }
}

async function deleteCourse(id) {
  if (!confirm('Delete this course? This cannot be undone.')) return
  await deleteDoc(doc(db, 'courses', id))
  await fetchCourses()
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Courses</h1>
        <p class="text-sm text-surface-500 mt-0.5">Manage all SkillBridge courses</p>
      </div>
      <button @click="createCourse" :disabled="creating" class="btn-primary text-sm">
        <svg v-if="creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        + New Course
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <!-- Empty state -->
    <div v-else-if="courses.length === 0" class="card p-12 text-center">
      <div class="text-5xl mb-4">🎓</div>
      <p class="font-semibold text-surface-700 mb-1">No courses yet</p>
      <p class="text-sm text-surface-400 mb-5">Create your first course to get started.</p>
      <button @click="createCourse" class="btn-primary">+ Create Course</button>
    </div>

    <!-- Course list -->
    <div v-else class="space-y-3">
      <div
        v-for="course in courses"
        :key="course.id"
        class="card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <!-- Thumbnail -->
        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-900 to-accent-900 shrink-0 overflow-hidden flex items-center justify-center">
          <img v-if="course.thumbnail" :src="course.thumbnail" class="w-full h-full object-cover" />
          <span v-else class="text-2xl">🎓</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-surface-900 text-sm">{{ course.title }}</h3>
            <span
              class="badge text-xs"
              :class="course.isPublished ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'"
            >
              {{ course.isPublished ? 'Published' : 'Draft' }}
            </span>
          </div>
          <p class="text-xs text-surface-400 mt-0.5">
            /courses/{{ course.slug }} · {{ course.totalLessons ?? 0 }} lessons
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <RouterLink
            :to="{ name: 'admin-lessons', params: { id: course.id } }"
            class="btn-ghost text-xs border border-surface-200"
          >
            Lessons
          </RouterLink>
          <RouterLink
            :to="{ name: 'admin-course-edit', params: { id: course.id } }"
            class="btn-secondary text-xs"
          >
            Edit
          </RouterLink>
          <button @click="deleteCourse(course.id)" class="btn-ghost text-xs text-red-500 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
