<script setup>
// ─── AdminPayments ────────────────────────────────────────────────────────────
// Admin reviews submitted payment receipts and approves or rejects them.

import { ref, computed, onMounted } from 'vue'
import { useAuthStore }             from '../../stores/authStore'
import { usePayment }               from '../../composables/usePayment'
import { useToast }                 from '../../composables/useToast'
import { db }                       from '../../firebase/config'
import { doc, getDoc }              from 'firebase/firestore'
import AppSpinner                   from '../../components/ui/AppSpinner.vue'

const auth  = useAuthStore()
const toast = useToast()
const { payments, loading, fetchAllPayments, approvePayment, rejectPayment } = usePayment()

const activeTab     = ref('submitted')
const actionLoading = ref(null)
const rejectModal   = ref(null)
const rejectReason  = ref('')
const lightboxUrl   = ref(null)   // receipt shown in full-screen overlay

const enriched = ref([])

onMounted(async () => {
  await loadPayments()
})

async function loadPayments() {
  await fetchAllPayments()
  enriched.value = await Promise.all(
    payments.value.map(async (p) => {
      const [userSnap, courseSnap] = await Promise.all([
        getDoc(doc(db, 'users',   p.studentId)),
        getDoc(doc(db, 'courses', p.courseId)),
      ])
      return {
        ...p,
        studentName:  userSnap.exists()   ? userSnap.data().displayName || userSnap.data().email : 'Unknown',
        studentEmail: userSnap.exists()   ? userSnap.data().email : '',
        courseTitle:  courseSnap.exists() ? courseSnap.data().title : 'Unknown Course',
      }
    })
  )
}

const filtered = computed(() => {
  if (activeTab.value === 'all') return enriched.value
  return enriched.value.filter(p => p.status === activeTab.value)
})

const counts = computed(() => ({
  all:       enriched.value.length,
  submitted: enriched.value.filter(p => p.status === 'submitted').length,
  approved:  enriched.value.filter(p => p.status === 'approved').length,
  rejected:  enriched.value.filter(p => p.status === 'rejected').length,
}))

async function handleApprove(payment) {
  actionLoading.value = payment.id
  try {
    await approvePayment(payment.id, payment.enrollmentId, auth.user.uid)
    await loadPayments()
    toast.success('Payment approved — student now has access.')
  } catch {
    toast.error('Failed to approve. Please try again.')
  } finally {
    actionLoading.value = null
  }
}

function openRejectModal(payment) {
  rejectModal.value  = { paymentId: payment.id, enrollmentId: payment.enrollmentId }
  rejectReason.value = ''
}

async function handleReject() {
  if (!rejectModal.value) return
  actionLoading.value = rejectModal.value.paymentId
  try {
    await rejectPayment(
      rejectModal.value.paymentId,
      rejectModal.value.enrollmentId,
      auth.user.uid,
      rejectReason.value,
    )
    await loadPayments()
    toast.success('Payment rejected.')
    rejectModal.value = null
  } catch {
    toast.error('Failed to reject. Please try again.')
  } finally {
    actionLoading.value = null
  }
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusClass(status) {
  return {
    submitted: 'bg-amber-100 text-amber-700',
    approved:  'bg-success-100 text-success-700',
    rejected:  'bg-red-100 text-red-700',
    pending:   'bg-surface-100 text-surface-500',
  }[status] || 'bg-surface-100 text-surface-500'
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-surface-900">Payment Reviews</h1>
      <p class="text-xs text-surface-400 mt-0.5">Review student payment receipts and approve or reject them</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit mb-6">
      <button
        v-for="tab in ['submitted', 'approved', 'rejected', 'all']"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize"
        :class="activeTab === tab ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'"
      >
        {{ tab }}
        <span class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
          :class="activeTab === tab ? 'bg-primary-100 text-primary-700' : 'bg-surface-200 text-surface-500'">
          {{ counts[tab] }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="card p-10 text-center text-surface-400">
      <p class="text-3xl mb-2">📭</p>
      <p class="font-medium text-surface-600">No {{ activeTab === 'all' ? '' : activeTab }} payments.</p>
    </div>

    <!-- Payment list -->
    <div v-else class="space-y-4">
      <div v-for="p in filtered" :key="p.id" class="card p-5">

        <!-- Top row: info + action buttons -->
        <div class="flex items-start gap-4 flex-wrap">

          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-surface-900">{{ p.studentName }}</span>
              <span class="text-xs text-surface-400">{{ p.studentEmail }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass(p.status)">
                {{ p.status }}
              </span>
            </div>
            <p class="text-sm text-surface-600 truncate">{{ p.courseTitle }}</p>
            <div class="flex items-center gap-4 text-xs text-surface-400">
              <span>Amount: <span class="font-semibold text-surface-700">{{ p.amount?.toLocaleString() }} {{ p.currency }}</span></span>
              <span>Submitted: {{ formatDate(p.submittedAt) }}</span>
            </div>
            <div v-if="p.receiptNote" class="text-xs text-surface-500 italic">Note: {{ p.receiptNote }}</div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <!-- Full-screen lightbox button -->
            <button
              v-if="p.receiptUrl"
              @click="lightboxUrl = p.receiptUrl"
              class="btn-ghost text-xs border border-surface-200"
            >
              Full Screen ⛶
            </button>
            <span v-else class="text-xs text-surface-400 italic">No receipt</span>

            <button
              v-if="p.status === 'submitted'"
              @click="handleApprove(p)"
              :disabled="actionLoading === p.id"
              class="text-xs bg-success-600 hover:bg-success-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {{ actionLoading === p.id ? 'Processing…' : 'Approve ✓' }}
            </button>

            <button
              v-if="p.status === 'submitted'"
              @click="openRejectModal(p)"
              class="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Reject ✕
            </button>

            <div v-if="p.status === 'rejected' && p.rejectReason" class="text-xs text-red-600 max-w-xs">
              Reason: {{ p.rejectReason }}
            </div>
          </div>
        </div>

        <!-- Receipt image — large preview always visible -->
        <div v-if="p.receiptUrl" class="mt-4 border-t border-surface-100 pt-4">
          <p class="text-xs font-medium text-surface-400 mb-2">Payment Receipt</p>
          <img
            :src="p.receiptUrl"
            class="w-full max-h-96 object-contain rounded-xl border border-surface-200 bg-surface-50 cursor-zoom-in"
            @click="lightboxUrl = p.receiptUrl"
            title="Click to view full screen"
          />
        </div>
      </div>
    </div>

    <!-- ── Full-screen lightbox ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="lightboxUrl"
        class="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
        @click.self="lightboxUrl = null"
      >
        <!-- Close button -->
        <button
          @click="lightboxUrl = null"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Image fills screen, letterboxed -->
        <img
          :src="lightboxUrl"
          class="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          @click.stop
        />

        <p class="absolute bottom-4 text-white/40 text-xs">Click outside to close</p>
      </div>
    </Teleport>

    <!-- Reject modal -->
    <div v-if="rejectModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h2 class="font-bold text-surface-900 text-lg">Reject Payment</h2>
        <p class="text-sm text-surface-500">The student will see this reason and can resubmit.</p>
        <div>
          <label class="label">Reason <span class="text-surface-400 font-normal">(optional)</span></label>
          <textarea
            v-model="rejectReason"
            rows="3"
            class="input resize-none"
            placeholder="e.g. Screenshot is unclear. Please upload a clearer receipt."
          />
        </div>
        <div class="flex gap-3">
          <button
            @click="handleReject"
            :disabled="actionLoading !== null"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {{ actionLoading ? 'Processing…' : 'Confirm Reject' }}
          </button>
          <button @click="rejectModal = null" class="btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
