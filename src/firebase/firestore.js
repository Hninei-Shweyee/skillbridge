// ─── Firestore CRUD Helpers ───────────────────────────────────────────────────
// Generic helper functions for common Firestore operations.
// Phase-specific logic (courses, enrollments, etc.) lives in composables —
// these are just low-level utilities.

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── Read a single document by ID ────────────────────────────────────────────
export async function getDocument(collectionPath, docId) {
  const ref  = doc(db, collectionPath, docId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─── Read all documents in a collection ──────────────────────────────────────
export async function getCollection(collectionPath) {
  const snap = await getDocs(collection(db, collectionPath))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Read documents with filters and sorting ─────────────────────────────────
// constraints: array of where() / orderBy() calls
export async function queryCollection(collectionPath, constraints = []) {
  const ref  = collection(db, collectionPath)
  const q    = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Create a document with a known ID ───────────────────────────────────────
// Use this when you want to control the ID (e.g., users/{uid})
export async function setDocument(collectionPath, docId, data) {
  const ref = doc(db, collectionPath, docId)
  await setDoc(ref, { ...data, createdAt: serverTimestamp() })
}

// ─── Create a document with an auto-generated ID ─────────────────────────────
export async function addDocument(collectionPath, data) {
  const ref = collection(db, collectionPath)
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

// ─── Update specific fields in a document ────────────────────────────────────
export async function updateDocument(collectionPath, docId, data) {
  const ref = doc(db, collectionPath, docId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

// ─── Delete a document ────────────────────────────────────────────────────────
export async function deleteDocument(collectionPath, docId) {
  const ref = doc(db, collectionPath, docId)
  await deleteDoc(ref)
}

// Re-export Firestore query helpers so components don't import from firebase directly
export { where, orderBy, serverTimestamp }
