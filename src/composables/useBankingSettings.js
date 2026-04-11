// ─── useBankingSettings ───────────────────────────────────────────────────────
// Admin-managed bank accounts shown to students on the payment page.

import { ref } from 'vue'
import { db } from '../firebase/config'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, serverTimestamp,
} from 'firebase/firestore'

export function useBankingSettings() {
  const settings = ref([])
  const loading  = ref(false)

  // ── Fetch all active banking settings (shown to students) ─────────────────
  async function fetchActiveSettings() {
    loading.value = true
    try {
      const q    = query(collection(db, 'bankingSettings'), where('isActive', '==', true))
      const snap = await getDocs(q)
      settings.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
    return settings.value
  }

  // ── Fetch all settings (admin view) ───────────────────────────────────────
  async function fetchAllSettings() {
    loading.value = true
    try {
      const snap = await getDocs(collection(db, 'bankingSettings'))
      settings.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
  }

  // ── Add a new bank account ─────────────────────────────────────────────────
  async function addSetting({ bankName, accountNumber, accountName, qrImageUrl, isActive }) {
    const docRef = await addDoc(collection(db, 'bankingSettings'), {
      bankName,
      accountNumber,
      accountName,
      qrImageUrl:  qrImageUrl || '',
      isActive:    !!isActive,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
    return docRef.id
  }

  // ── Update a bank account ──────────────────────────────────────────────────
  async function updateSetting(id, fields) {
    await updateDoc(doc(db, 'bankingSettings', id), {
      ...fields,
      updatedAt: serverTimestamp(),
    })
  }

  // ── Delete a bank account ──────────────────────────────────────────────────
  async function deleteSetting(id) {
    await deleteDoc(doc(db, 'bankingSettings', id))
  }

  return {
    settings,
    loading,
    fetchActiveSettings,
    fetchAllSettings,
    addSetting,
    updateSetting,
    deleteSetting,
  }
}
