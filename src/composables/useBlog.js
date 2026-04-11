// ─── useBlog ──────────────────────────────────────────────────────────────────
// Firestore CRUD for blogPosts collection.
// type: 'blog' | 'vlog'

import { ref }           from 'vue'
import { db }            from '../firebase/config'
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'

export const BLOG_CATEGORIES = [
  'IT Knowledge',
  'AI Tools',
  'Career Development',
  'Business',
  'Tutorials',
  'News',
]

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function useBlog() {
  const posts   = ref([])
  const loading = ref(false)

  async function fetchPublishedPosts() {
    loading.value = true
    try {
      // Fetch all posts and filter/sort client-side to avoid requiring composite indexes
      const snap = await getDocs(collection(db, 'blogPosts'))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      posts.value = all
        .filter(p => p.isPublished === true)
        .sort((a, b) => {
          const ta = a.publishedAt?.toDate?.() ?? a.createdAt?.toDate?.() ?? new Date(0)
          const tb = b.publishedAt?.toDate?.() ?? b.createdAt?.toDate?.() ?? new Date(0)
          return tb - ta
        })
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPosts() {
    loading.value = true
    try {
      const snap = await getDocs(
        query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'))
      )
      posts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
  }

  async function fetchPostBySlug(slug) {
    const snap = await getDocs(
      query(collection(db, 'blogPosts'), where('slug', '==', slug))
    )
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() }
  }

  async function getSimilarPosts(currentId, categories, limit = 3) {
    if (!categories?.length) return []
    const snap = await getDocs(collection(db, 'blogPosts'))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p =>
        p.isPublished === true &&
        p.id !== currentId &&
        (p.categories || []).some(c => categories.includes(c))
      )
      .sort((a, b) => {
        const ta = a.publishedAt?.toDate?.() ?? new Date(0)
        const tb = b.publishedAt?.toDate?.() ?? new Date(0)
        return tb - ta
      })
      .slice(0, limit)
  }

  async function addPost(data) {
    const slug = slugify(data.title)
    await addDoc(collection(db, 'blogPosts'), {
      ...data,
      slug,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? serverTimestamp() : null,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
  }

  async function updatePost(id, data) {
    await updateDoc(doc(db, 'blogPosts', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function togglePublish(id, currentState) {
    const updates = { isPublished: !currentState, updatedAt: serverTimestamp() }
    if (!currentState) updates.publishedAt = serverTimestamp()
    await updateDoc(doc(db, 'blogPosts', id), updates)
    const post = posts.value.find(p => p.id === id)
    if (post) post.isPublished = !currentState
  }

  async function deletePost(id) {
    await deleteDoc(doc(db, 'blogPosts', id))
    posts.value = posts.value.filter(p => p.id !== id)
  }

  return {
    posts, loading,
    fetchPublishedPosts, fetchAllPosts, fetchPostBySlug,
    getSimilarPosts, addPost, updatePost, togglePublish, deletePost,
  }
}
