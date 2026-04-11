// ─── Progress Store (Pinia) ───────────────────────────────────────────────────
// Tracks which lessons a student has completed.
// Reads/writes to Firestore: progress/{studentId}/courses/{courseId}

import { defineStore }  from 'pinia'
import { ref, computed } from 'vue'
import { db }           from '../firebase/config'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'

export const useProgressStore = defineStore('progress', () => {
  // ─── State ───────────────────────────────────────────────────────────────
  const completedLessons = ref([]) // array of lessonIds the student finished
  const lastLessonId     = ref(null)
  const percentComplete  = ref(0)

  // ─── Computed ────────────────────────────────────────────────────────────
  const completedSet = computed(() => new Set(completedLessons.value))

  function isCompleted(lessonId) {
    return completedSet.value.has(lessonId)
  }

  // ─── Load progress for a specific course ─────────────────────────────────
  async function loadProgress(studentId, courseId) {
    const ref_ = doc(db, `progress/${studentId}/courses/${courseId}`)
    const snap = await getDoc(ref_)
    if (snap.exists()) {
      const data = snap.data()
      completedLessons.value = data.completedLessons ?? []
      lastLessonId.value     = data.lastLessonId ?? null
      percentComplete.value  = data.percentComplete ?? 0
    } else {
      completedLessons.value = []
      lastLessonId.value     = null
      percentComplete.value  = 0
    }
  }

  // ─── Mark a lesson as complete ────────────────────────────────────────────
  async function markComplete(studentId, courseId, lessonId, totalLessons) {
    // Add to local state immediately (optimistic update)
    if (!completedLessons.value.includes(lessonId)) {
      completedLessons.value = [...completedLessons.value, lessonId]
    }
    lastLessonId.value = lessonId
    percentComplete.value = Math.round(
      (completedLessons.value.length / totalLessons) * 100
    )

    // Persist to Firestore
    const ref_ = doc(db, `progress/${studentId}/courses/${courseId}`)
    await setDoc(ref_, {
      completedLessons: completedLessons.value,
      lastLessonId:     lessonId,
      lastAccessedAt:   serverTimestamp(),
      percentComplete:  percentComplete.value,
    }, { merge: true })
  }

  // ─── Reset local state when leaving a course ──────────────────────────────
  function clearProgress() {
    completedLessons.value = []
    lastLessonId.value     = null
    percentComplete.value  = 0
  }

  return {
    completedLessons,
    lastLessonId,
    percentComplete,
    isCompleted,
    loadProgress,
    markComplete,
    clearProgress,
  }
})
