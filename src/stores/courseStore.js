// ─── Course Store (Pinia) ─────────────────────────────────────────────────────
// Manages the list of courses and the currently viewed course.
// Components read from here instead of calling Firestore directly.

import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { db }          from '../firebase/config'
import {
  collection, getDocs, getDoc, doc,
  query, where, orderBy,
} from 'firebase/firestore'

export const useCourseStore = defineStore('course', () => {
  const courses       = ref([])
  const currentCourse = ref(null)
  const lessons       = ref([])
  const loading       = ref(false)

  // ─── Fetch all published courses ─────────────────────────────────────────
  // Filters by isPublished only (no compound orderBy) to avoid needing a
  // composite index. We sort client-side by createdAt instead.
  async function fetchCourses() {
    loading.value = true
    try {
      const q    = query(collection(db, 'courses'), where('isPublished', '==', true))
      const snap = await getDocs(q)
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Sort client-side: newest first (handles missing createdAt gracefully)
      docs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0
        const bTime = b.createdAt?.toMillis?.() ?? 0
        return bTime - aTime
      })

      courses.value = docs
    } finally {
      loading.value = false
    }
  }

  // ─── Fetch a single course by ID ─────────────────────────────────────────
  async function fetchCourse(courseId) {
    loading.value = true
    try {
      const snap = await getDoc(doc(db, 'courses', courseId))
      currentCourse.value = snap.exists() ? { id: snap.id, ...snap.data() } : null
    } finally {
      loading.value = false
    }
  }

  // ─── Fetch a single course by slug ───────────────────────────────────────
  async function fetchCourseBySlug(slug) {
    loading.value = true
    try {
      // Query by slug only — no compound filter needed
      const q    = query(collection(db, 'courses'), where('slug', '==', slug))
      const snap = await getDocs(q)
      const found = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Filter published client-side so we don't need a composite index
      currentCourse.value = found.find(c => c.isPublished) ?? null
    } finally {
      loading.value = false
    }
  }

  // ─── Fetch lessons for a course (ordered by day number) ──────────────────
  // Queries by isPublished only, sorts client-side to avoid composite index.
  async function fetchLessons(courseId) {
    loading.value = true
    try {
      const q    = query(
        collection(db, `courses/${courseId}/lessons`),
        where('isPublished', '==', true)
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Sort by order field ascending
      docs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      lessons.value = docs
    } finally {
      loading.value = false
    }
  }

  // ─── Admin: fetch ALL lessons (including drafts) ──────────────────────────
  async function fetchAllLessons(courseId) {
    loading.value = true
    try {
      const snap = await getDocs(
        query(collection(db, `courses/${courseId}/lessons`), orderBy('order', 'asc'))
      )
      lessons.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
  }

  function clearCurrentCourse() {
    currentCourse.value = null
    lessons.value = []
  }

  return {
    courses,
    currentCourse,
    lessons,
    loading,
    fetchCourses,
    fetchCourse,
    fetchCourseBySlug,
    fetchLessons,
    fetchAllLessons,
    clearCurrentCourse,
  }
})
