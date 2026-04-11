<script setup>
// ─── PaymentPage ──────────────────────────────────────────────────────────────
// Student pays via bank transfer then uploads receipt photo from device.
// Receipt is compressed client-side and stored as base64 in Firestore.

import { ref, onMounted }       from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import { useAuthStore }         from '../../stores/authStore'
import { usePayment }           from '../../composables/usePayment'
import { useEnrollment }        from '../../composables/useEnrollment'
import { useBankingSettings }   from '../../composables/useBankingSettings'
import { db }                   from '../../firebase/config'
import { doc, getDoc }          from 'firebase/firestore'
import { useToast }             from '../../composables/useToast'
import AppSpinner               from '../../components/ui/AppSpinner.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()

const courseId = route.params.courseId

const { fetchPaymentByCourse, createPayment, submitReceipt } = usePayment()
const { fetchEnrollmentStatus }               = useEnrollment()
const { fetchActiveSettings, settings }       = useBankingSettings()

const course         = ref(null)
const payment        = ref(null)
const enrollment     = ref(null)
const loading        = ref(true)
const submitting     = ref(false)
const receiptPreview = ref('')   // base64 data URL shown as preview + stored
const receiptNote    = ref('')
const selectedBankId = ref('')

onMounted(async () => {
  const snap = await getDoc(doc(db, 'courses', courseId))
  if (!snap.exists()) {
    toast.error('Course not found.')
    router.push({ name: 'courses' })
    return
  }
  course.value = { id: snap.id, ...snap.data() }

  enrollment.value = await fetchEnrollmentStatus(auth.user.uid, courseId)

  if (enrollment.value?.status === 'active') {
    router.push({ name: 'my-course', params: { courseId } })
    return
  }
  if (enrollment.value?.status === 'payment_submitted') {
    router.push({ name: 'payment-status', params: { courseId } })
    return
  }

  // Always try to load an existing payment doc (regardless of enrollment source)
  payment.value = await fetchPaymentByCourse(auth.user.uid, courseId)

  await fetchActiveSettings()
  if (settings.value.length > 0) {
    selectedBankId.value = settings.value[0].id
  }

  loading.value = false
})

// ── Compress image file to base64 (~600px max, JPEG 65%) ─────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h / w) * MAX); w = MAX }
          else       { w = Math.round((w / h) * MAX); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.65))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file (JPG, PNG, etc.)')
    return
  }
  try {
    receiptPreview.value = await compressImage(file)
  } catch {
    toast.error('Could not read the image. Please try another file.')
  }
}

async function handleSubmit() {
  if (!receiptPreview.value) {
    toast.error('Please select your payment receipt photo.')
    return
  }
  if (!enrollment.value) {
    toast.error('Enrollment record not found. Please go back and try again.')
    return
  }

  submitting.value = true
  try {
    // If no payment doc exists yet, create one now (handles manual enrollments)
    if (!payment.value) {
      const newPaymentId = await createPayment({
        studentId:    auth.user.uid,
        courseId,
        enrollmentId: enrollment.value.id,
        amount:       course.value?.price ?? 0,
        currency:     course.value?.currency ?? 'MMK',
      })
      payment.value = { id: newPaymentId }
    }

    await submitReceipt({
      paymentId:        payment.value.id,
      enrollmentId:     enrollment.value.id,
      receiptUrl:       receiptPreview.value,
      receiptNote:      receiptNote.value.trim(),
      bankingSettingId: selectedBankId.value,
    })
    toast.success('Receipt submitted! Waiting for admin approval.')
    router.push({ name: 'payment-status', params: { courseId } })
  } catch {
    toast.error('Failed to submit. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-10">

    <div v-if="loading" class="flex justify-center py-20"><AppSpinner size="lg" /></div>

    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <RouterLink :to="{ name: 'course-detail', params: { slug: course?.slug } }" class="text-sm text-surface-400 hover:text-surface-700 flex items-center gap-1 mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to course
        </RouterLink>
        <h1 class="text-2xl font-bold text-surface-900">Complete Your Payment</h1>
        <p class="text-surface-500 mt-1">Pay via bank transfer, then upload your receipt below.</p>
      </div>

      <!-- Course summary -->
      <div class="card p-4 flex items-center gap-4 mb-6">
        <div class="w-16 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary-900 to-accent-900 shrink-0 flex items-center justify-center">
          <img v-if="course?.thumbnail" :src="course.thumbnail" class="w-full h-full object-cover" />
          <span v-else class="text-2xl">🎓</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-surface-900 truncate">{{ course?.title }}</p>
          <p class="text-xs text-surface-400">{{ course?.instructor }}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-lg font-bold text-primary-600">
            {{ course?.price?.toLocaleString() }} {{ course?.currency }}
          </p>
        </div>
      </div>

      <!-- No banking settings configured -->
      <div v-if="settings.length === 0" class="card p-6 text-center text-surface-400">
        <p class="text-2xl mb-2">🏦</p>
        <p class="font-medium text-surface-600">Payment details not yet configured.</p>
        <p class="text-sm mt-1">Please contact us directly to complete your enrollment.</p>
      </div>

      <template v-else>
        <!-- Banking details -->
        <div class="space-y-4 mb-6">
          <h2 class="font-semibold text-surface-800 text-sm">Transfer to any of these accounts:</h2>

          <div v-for="bank in settings" :key="bank.id"
            class="card p-6 border-2 transition-colors cursor-pointer"
            :class="selectedBankId === bank.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200'"
            @click="selectedBankId = bank.id"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-3 flex-1">
                <!-- Bank name — large -->
                <p class="text-2xl font-extrabold text-surface-900">{{ bank.bankName }}</p>

                <!-- Account number — very prominent -->
                <div>
                  <p class="text-xs text-surface-400 mb-0.5">Account Number</p>
                  <p class="text-3xl font-extrabold font-mono text-primary-700 tracking-wider select-all">
                    {{ bank.accountNumber }}
                  </p>
                </div>

                <!-- Account name -->
                <div>
                  <p class="text-xs text-surface-400 mb-0.5">Account Name</p>
                  <p class="text-lg font-semibold text-surface-800">{{ bank.accountName }}</p>
                </div>

                <!-- Amount to transfer -->
                <div class="inline-flex items-center gap-2 bg-primary-100 text-primary-800 px-4 py-2 rounded-xl">
                  <span class="text-sm font-medium">Transfer amount:</span>
                  <span class="text-lg font-extrabold">{{ course?.price?.toLocaleString() }} {{ course?.currency }}</span>
                </div>
              </div>

              <!-- Selected indicator -->
              <div class="shrink-0 mt-1">
                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  :class="selectedBankId === bank.id ? 'border-primary-500 bg-primary-500' : 'border-surface-300'">
                  <svg v-if="selectedBankId === bank.id" class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 text-sm text-amber-800 space-y-1">
          <p class="font-semibold">How to pay:</p>
          <ol class="list-decimal list-inside space-y-1 text-amber-700">
            <li>Transfer the exact amount to one of the accounts above</li>
            <li>Take a screenshot of your transfer receipt</li>
            <li>Upload the screenshot using the button below</li>
          </ol>
        </div>

        <!-- Receipt upload form -->
        <div class="card p-5 space-y-4">
          <h2 class="font-semibold text-surface-900 text-sm">Upload Payment Receipt</h2>

          <!-- File picker -->
          <div>
            <label class="label">Receipt Photo <span class="text-red-500">*</span></label>
            <label class="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
              :class="receiptPreview ? 'border-primary-300 bg-primary-50' : 'border-surface-300 bg-surface-50 hover:bg-surface-100'"
            >
              <template v-if="!receiptPreview">
                <svg class="w-8 h-8 text-surface-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-sm font-medium text-surface-600">Tap to select receipt photo</p>
                <p class="text-xs text-surface-400 mt-1">JPG, PNG — from your phone or computer</p>
              </template>
              <template v-else>
                <p class="text-xs font-medium text-primary-700 mb-2">Receipt selected ✓ — tap to change</p>
              </template>
              <input type="file" accept="image/*" class="hidden" @change="handleFileChange" />
            </label>
          </div>

          <!-- Receipt preview -->
          <div v-if="receiptPreview" class="rounded-xl overflow-hidden border border-surface-200">
            <img :src="receiptPreview" class="w-full object-contain max-h-72" />
          </div>

          <div>
            <label class="label">Note <span class="text-surface-400 font-normal">(optional)</span></label>
            <input
              v-model="receiptNote"
              type="text"
              class="input"
              placeholder="e.g. Transfer on 4 Apr 2026, ref: 12345"
            />
          </div>

          <button
            @click="handleSubmit"
            :disabled="submitting || !receiptPreview"
            class="btn-primary w-full"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ submitting ? 'Submitting…' : 'Submit Receipt for Review' }}
          </button>
        </div>
      </template>
    </template>
  </div>
</template>
