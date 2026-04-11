// ─── Navigation Guards ────────────────────────────────────────────────────────
// Runs before every route change.
//
// Guard rules:
//   requiresAuth        → must be logged in, else → /login
//   requiresAdmin       → must have role='admin', else → /dashboard
//   guestOnly           → must NOT be logged in, else → /dashboard
//   requiresEnrollment  → must have ACTIVE enrollment in :courseId param
//                         pending/submitted → /payment/:courseId/status
//                         not enrolled      → course detail page

import { useAuthStore } from '../stores/authStore'
import { watch }        from 'vue'
import { db }           from '../firebase/config'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'

// Wait for Firebase Auth to resolve before any guard runs
function waitForAuth(authStore) {
  if (!authStore.loading) return Promise.resolve()
  return new Promise((resolve) => {
    const unwatch = watch(
      () => authStore.loading,
      (loading) => {
        if (!loading) { unwatch(); resolve() }
      }
    )
  })
}

// Returns the enrollment doc { status, courseId, ... } or null if not found
async function getEnrollment(studentId, courseId) {
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

export function setupGuards(router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    // Block until Firebase Auth resolves on first load
    await waitForAuth(authStore)

    // ── Guest-only routes (login, signup) ──────────────────────────────────
    if (to.meta.guestOnly && authStore.isLoggedIn) {
      return { name: 'dashboard' }
    }

    // ── Routes that require login ───────────────────────────────────────────
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // ── Admin-only routes (main admin + co-admin both allowed in) ──────────
    if (to.meta.requiresAdmin && !authStore.isAnyAdmin) {
      return { name: 'dashboard' }
    }

    // ── Co-admin route restriction ──────────────────────────────────────────
    // Co-admin can only access these 4 sections:
    const CO_ADMIN_ALLOWED = [
      '/admin/dashboard',
      '/admin/students',
      '/admin/enrollments',
      '/admin/payments',
    ]
    if (authStore.isCoAdmin && to.path.startsWith('/admin')) {
      const allowed = CO_ADMIN_ALLOWED.some(p => to.path.startsWith(p))
      if (!allowed) return { name: 'admin-dashboard' }
    }

    // ── Enrollment check for lesson viewer ─────────────────────────────────
    // Only active enrollment allows access.
    // pending_payment / payment_submitted → send to payment status page.
    // Not enrolled → send to course detail so they can enroll.
    if (to.meta.requiresEnrollment && authStore.isLoggedIn) {
      const courseId = to.params.courseId
      if (courseId) {
        const enrollment = await getEnrollment(authStore.user.uid, courseId)

        if (!enrollment) {
          // Never enrolled — go to course detail to enroll
          return { name: 'course-detail', params: { slug: courseId } }
        }

        if (enrollment.status === 'active') {
          // Full access — continue
          return true
        }

        if (enrollment.status === 'payment_submitted' || enrollment.status === 'pending_payment') {
          // Waiting for admin approval
          return { name: 'payment-status', params: { courseId } }
        }

        if (enrollment.status === 'rejected') {
          // Payment was rejected — send back to payment page to retry
          return { name: 'payment', params: { courseId } }
        }

        // suspended or unknown — send to dashboard
        return { name: 'dashboard' }
      }
    }

    return true
  })
}
