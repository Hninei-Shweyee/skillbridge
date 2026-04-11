// ─── useTestimonials ──────────────────────────────────────────────────────────
// Admin manages testimonials per course. Public pages show published ones only.

import { ref } from 'vue'
import { db } from '../firebase/config'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'

export function useTestimonials() {
  const testimonials = ref([])
  const loading      = ref(false)

  // ── Fetch published testimonials for a course (public page) ───────────────
  async function fetchTestimonials(courseId) {
    loading.value = true
    try {
      const q    = query(
        collection(db, 'testimonials'),
        where('courseId',    '==', courseId),
        where('isPublished', '==', true),
      )
      const snap = await getDocs(q)
      testimonials.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
    return testimonials.value
  }

  // ── Fetch ALL testimonials for a course (admin view) ──────────────────────
  async function fetchAllTestimonials(courseId) {
    loading.value = true
    try {
      const constraints = courseId
        ? [where('courseId', '==', courseId), orderBy('createdAt', 'desc')]
        : [orderBy('createdAt', 'desc')]
      const q    = query(collection(db, 'testimonials'), ...constraints)
      const snap = await getDocs(q)
      testimonials.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
  }

  // ── Add a testimonial ─────────────────────────────────────────────────────
  async function addTestimonial({ courseId, studentName, studentAvatar, content, rating, isPublished }) {
    const docRef = await addDoc(collection(db, 'testimonials'), {
      courseId,
      studentName,
      studentAvatar: studentAvatar || '',
      content,
      rating:        Number(rating) || 5,
      isPublished:   !!isPublished,
      createdAt:     serverTimestamp(),
    })
    return docRef.id
  }

  // ── Update a testimonial ──────────────────────────────────────────────────
  async function updateTestimonial(id, fields) {
    await updateDoc(doc(db, 'testimonials', id), fields)
  }

  // ── Toggle published / draft ──────────────────────────────────────────────
  async function togglePublish(id, currentValue) {
    await updateDoc(doc(db, 'testimonials', id), { isPublished: !currentValue })
    const t = testimonials.value.find(t => t.id === id)
    if (t) t.isPublished = !currentValue
  }

  // ── Delete a testimonial ──────────────────────────────────────────────────
  async function deleteTestimonial(id) {
    await deleteDoc(doc(db, 'testimonials', id))
    testimonials.value = testimonials.value.filter(t => t.id !== id)
  }

  return {
    testimonials,
    loading,
    fetchTestimonials,
    fetchAllTestimonials,
    addTestimonial,
    updateTestimonial,
    togglePublish,
    deleteTestimonial,
  }
}
