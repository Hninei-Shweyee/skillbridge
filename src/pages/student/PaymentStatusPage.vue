<script setup>
// ─── PaymentStatusPage ────────────────────────────────────────────────────────
// Shows the current state of a student's payment:
//   pending_payment   → remind them to submit receipt
//   payment_submitted → waiting for admin review
//   active            → approved, redirect to course
//   rejected          → show reason, allow retry

import { ref, onMounted }      from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }        from '../../stores/authStore'
import { useEnrollment }       from '../../composables/useEnrollment'
import { usePayment }          from '../../composables/usePayment'
import { db }                  from '../../firebase/config'
import { doc, getDoc }         from 'firebase/firestore'
import AppSpinner              from '../../components/ui/AppSpinner.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const courseId = route.params.courseId

const { fetchEnrollmentStatus } = useEnrollment()
const { fetchPaymentByCourse }  = usePayment()

const course     = ref(null)
const enrollment = ref(null)
const payment    = ref(null)
const loading    = ref(true)

onMounted(async () => {
  const snap = await getDoc(doc(db, 'courses', courseId))
  if (snap.exists()) course.value = { id: snap.id, ...snap.data() }

  enrollment.value = await fetchEnrollmentStatus(auth.user.uid, courseId)

  // If enrollment is active → redirect to course
  if (enrollment.value?.status === 'active') {
    router.push({ name: 'my-course', params: { courseId } })
    return
  }

  if (enrollment.value) {
    payment.value = await fetchPaymentByCourse(auth.user.uid, courseId)
  }

  loading.value = false
})
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-16 text-center">

    <div v-if="loading" class="flex justify-center py-20"><AppSpinner size="lg" /></div>

    <template v-else>

      <!-- No enrollment found -->
      <template v-if="!enrollment">
        <div class="text-5xl mb-4">🤔</div>
        <h1 class="text-xl font-bold text-surface-900 mb-2">No enrollment found</h1>
        <p class="text-surface-500 mb-6">It looks like you haven't enrolled in this course yet.</p>
        <RouterLink :to="{ name: 'course-detail', params: { slug: course?.slug } }" class="btn-primary">
          View Course
        </RouterLink>
      </template>

      <!-- Pending: receipt not yet submitted -->
      <template v-else-if="enrollment.status === 'pending_payment'">
        <div class="text-5xl mb-4">💳</div>
        <h1 class="text-xl font-bold text-surface-900 mb-2">Payment Required</h1>
        <p class="text-surface-500 mb-6">
          Please complete your payment and upload your receipt to get access to
          <span class="font-semibold text-surface-800">{{ course?.title }}</span>.
        </p>
        <RouterLink :to="{ name: 'payment', params: { courseId } }" class="btn-primary">
          Complete Payment
        </RouterLink>
      </template>

      <!-- Submitted: waiting for admin review -->
      <template v-else-if="enrollment.status === 'payment_submitted'">
        <div class="text-5xl mb-4">⏳</div>
        <h1 class="text-xl font-bold text-surface-900 mb-2">Receipt Under Review</h1>
        <p class="text-surface-500 mb-4">
          Your payment receipt has been submitted. Our team will verify your payment
          and grant you access within 24 hours.
        </p>

        <!-- Receipt preview -->
        <div v-if="payment?.receiptUrl" class="card p-4 text-left mb-6">
          <p class="text-xs font-medium text-surface-500 mb-2">Your submitted receipt:</p>
          <img :src="payment.receiptUrl" class="w-full rounded-lg max-h-48 object-contain border border-surface-200" />
          <p v-if="payment.receiptNote" class="text-xs text-surface-400 mt-2">Note: {{ payment.receiptNote }}</p>
        </div>

        <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700 text-left mb-6">
          <p class="font-semibold mb-1">What happens next?</p>
          <ul class="space-y-1 list-disc list-inside">
            <li>Admin will review your receipt</li>
            <li>You'll get access as soon as it's approved</li>
            <li>Check back here for updates</li>
          </ul>
        </div>

        <RouterLink :to="{ name: 'dashboard' }" class="btn-ghost text-sm">
          Back to Dashboard
        </RouterLink>
      </template>

      <!-- Rejected: show reason, offer retry -->
      <template v-else-if="enrollment.status === 'rejected'">
        <div class="text-5xl mb-4">❌</div>
        <h1 class="text-xl font-bold text-surface-900 mb-2">Payment Not Approved</h1>
        <p class="text-surface-500 mb-4">
          Unfortunately your payment could not be verified.
        </p>

        <div v-if="payment?.rejectReason" class="card p-4 text-left mb-6 border-red-200 bg-red-50">
          <p class="text-xs font-semibold text-red-600 mb-1">Reason from admin:</p>
          <p class="text-sm text-red-700">{{ payment.rejectReason }}</p>
        </div>

        <p class="text-sm text-surface-500 mb-6">
          Please make sure you transfer the exact amount and upload a clear screenshot of your receipt.
        </p>

        <RouterLink :to="{ name: 'payment', params: { courseId } }" class="btn-primary">
          Try Again
        </RouterLink>
      </template>

      <!-- Suspended -->
      <template v-else-if="enrollment.status === 'suspended'">
        <div class="text-5xl mb-4">🔒</div>
        <h1 class="text-xl font-bold text-surface-900 mb-2">Enrollment Suspended</h1>
        <p class="text-surface-500 mb-6">
          Your access to this course has been suspended. Please contact support for help.
        </p>
        <RouterLink :to="{ name: 'dashboard' }" class="btn-ghost">Back to Dashboard</RouterLink>
      </template>

    </template>
  </div>
</template>
