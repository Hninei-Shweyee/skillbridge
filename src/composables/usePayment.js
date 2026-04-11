// ─── usePayment ───────────────────────────────────────────────────────────────
// Handles all payment-related Firestore operations.
// Payment lifecycle: pending → submitted → approved | rejected

import { ref } from 'vue'
import { db } from '../firebase/config'
import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, serverTimestamp, limit,
} from 'firebase/firestore'

export function usePayment() {
  const payment  = ref(null)
  const payments = ref([])
  const loading  = ref(false)

  // ── Create a payment record when student initiates enrollment ──────────────
  // Called immediately when enrollment doc is created (status: pending_payment)
  async function createPayment({ studentId, courseId, enrollmentId, amount, currency }) {
    const docRef = await addDoc(collection(db, 'payments'), {
      studentId,
      courseId,
      enrollmentId,
      amount,
      currency,
      bankingSettingId: '',
      receiptUrl:       '',
      receiptNote:      '',
      status:           'pending',
      submittedAt:      null,
      reviewedAt:       null,
      reviewedBy:       null,
      rejectReason:     null,
      createdAt:        serverTimestamp(),
    })
    return docRef.id
  }

  // ── Student submits receipt URL ────────────────────────────────────────────
  async function submitReceipt({ paymentId, enrollmentId, receiptUrl, receiptNote, bankingSettingId }) {
    // Update payment doc
    await updateDoc(doc(db, 'payments', paymentId), {
      receiptUrl,
      receiptNote:      receiptNote || '',
      bankingSettingId: bankingSettingId || '',
      status:           'submitted',
      submittedAt:      serverTimestamp(),
    })
    // Update enrollment status
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'payment_submitted',
    })
  }

  // ── Fetch payment record for a specific student + course ───────────────────
  async function fetchPaymentByCourse(studentId, courseId) {
    loading.value = true
    try {
      const q = query(
        collection(db, 'payments'),
        where('studentId', '==', studentId),
        where('courseId',  '==', courseId),
        limit(1),
      )
      const snap = await getDocs(q)
      payment.value = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
    } finally {
      loading.value = false
    }
    return payment.value
  }

  // ── Fetch all payments (admin) — optionally filter by status ──────────────
  async function fetchAllPayments(statusFilter = null) {
    loading.value = true
    try {
      const constraints = [orderBy('createdAt', 'desc')]
      if (statusFilter) constraints.unshift(where('status', '==', statusFilter))
      const q    = query(collection(db, 'payments'), ...constraints)
      const snap = await getDocs(q)
      payments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
  }

  // ── Admin: approve a payment ───────────────────────────────────────────────
  async function approvePayment(paymentId, enrollmentId, adminUid) {
    await updateDoc(doc(db, 'payments', paymentId), {
      status:     'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminUid,
    })
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'active',
    })
  }

  // ── Admin: reject a payment ────────────────────────────────────────────────
  async function rejectPayment(paymentId, enrollmentId, adminUid, rejectReason) {
    await updateDoc(doc(db, 'payments', paymentId), {
      status:       'rejected',
      rejectReason: rejectReason || '',
      reviewedAt:   serverTimestamp(),
      reviewedBy:   adminUid,
    })
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'rejected',
    })
  }

  return {
    payment,
    payments,
    loading,
    createPayment,
    submitReceipt,
    fetchPaymentByCourse,
    fetchAllPayments,
    approvePayment,
    rejectPayment,
  }
}
