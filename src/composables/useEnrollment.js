// ─── useEnrollment ────────────────────────────────────────────────────────────
// Handles all enrollment logic.
// Enrollment status lifecycle:
//   pending_payment → payment_submitted → active  (paid courses)
//   active                                        (free courses or admin manual enroll)
//   rejected | suspended                          (admin actions)

import { ref } from 'vue'
import { db }  from '../firebase/config'
import {
  collection, query, where, getDocs,
  addDoc, limit, serverTimestamp,
} from 'firebase/firestore'
import { usePayment } from './usePayment'

export function useEnrollment() {
  const enrollments = ref([])
  const enrolling   = ref(false)
  const loading     = ref(false)

  // ── Fetch the enrollment doc for a student + course (any status) ───────────
  async function fetchEnrollmentStatus(studentId, courseId) {
    const q    = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      where('courseId',  '==', courseId),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }

  // ── Check if student has an active enrollment ──────────────────────────────
  async function isEnrolled(studentId, courseId) {
    const q    = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      where('courseId',  '==', courseId),
      where('status',    '==', 'active'),
    )
    const snap = await getDocs(q)
    return !snap.empty
  }

  // ── Enroll a student in a course ───────────────────────────────────────────
  // For paid courses: creates enrollment with status pending_payment + payment doc
  // For free courses: creates enrollment with status active immediately
  // Returns: { enrollmentId, paymentId, status }
  async function enroll(studentId, courseId, coursePrice, courseCurrency) {
    // Check for any existing enrollment (any status)
    const existing = await fetchEnrollmentStatus(studentId, courseId)
    if (existing) {
      return { enrollmentId: existing.id, paymentId: existing.paymentId || null, status: existing.status }
    }

    enrolling.value = true
    try {
      const isFree  = !coursePrice || Number(coursePrice) === 0
      const status  = isFree ? 'active' : 'pending_payment'

      const enrollRef = await addDoc(collection(db, 'enrollments'), {
        studentId,
        courseId,
        enrolledAt:  serverTimestamp(),
        status,
        paymentId:   null,
        enrolledBy:  'self',
      })

      let paymentId = null
      if (!isFree) {
        const { createPayment } = usePayment()
        paymentId = await createPayment({
          studentId,
          courseId,
          enrollmentId: enrollRef.id,
          amount:       Number(coursePrice),
          currency:     courseCurrency || 'MMK',
        })
      }

      return { enrollmentId: enrollRef.id, paymentId, status }
    } finally {
      enrolling.value = false
    }
  }

  // ── Fetch all enrollments for a student (dashboard) ────────────────────────
  // Returns enrollments of all statuses so dashboard can show pending badge too
  async function fetchMyEnrollments(studentId) {
    loading.value = true
    try {
      const q    = query(
        collection(db, 'enrollments'),
        where('studentId', '==', studentId),
      )
      const snap = await getDocs(q)

      const results = await Promise.all(
        snap.docs.map(async (d) => {
          const enrollment = { id: d.id, ...d.data() }
          const { getDocument } = await import('../firebase/firestore')
          const course = await getDocument('courses', enrollment.courseId)
          return { ...enrollment, course }
        })
      )

      // Sort: active first, then pending, then rejected/suspended
      const order = { active: 0, payment_submitted: 1, pending_payment: 2, rejected: 3, suspended: 4 }
      enrollments.value = results
        .filter(e => e.course)
        .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
    } finally {
      loading.value = false
    }
  }

  return {
    enrollments,
    enrolling,
    loading,
    enroll,
    isEnrolled,
    fetchEnrollmentStatus,
    fetchMyEnrollments,
  }
}
