<script setup>
// ─── AdminCourseEdit ──────────────────────────────────────────────────────────
// Edit all fields of a course: title, slug, description, instructor, price,
// currency, published status, and thumbnail image upload to Firebase Storage.

import { ref, onMounted }  from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db }              from '../../firebase/config'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import AppSpinner          from '../../components/ui/AppSpinner.vue'
import { useToast }        from '../../composables/useToast'

const toast = useToast()

const route  = useRoute()
const router = useRouter()
const id     = route.params.id

// Form state
const form = ref({
  title: '', slug: '', description: '', instructor: 'SkillBridge',
  price: 0, currency: 'MMK', isPublished: false, totalLessons: 0, thumbnail: '',
})
const loading = ref(true)
const saving  = ref(false)

onMounted(async () => {
  const snap = await getDoc(doc(db, 'courses', id))
  if (snap.exists()) Object.assign(form.value, snap.data())
  loading.value = false
})

// Save all fields
async function save() {
  saving.value = true
  try {
    await updateDoc(doc(db, 'courses', id), {
      ...form.value,
      updatedAt: serverTimestamp(),
    })
    toast.success('Course saved!')
  } catch {
    toast.error('Failed to save. Please try again.')
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <div class="animate-fade-in max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <RouterLink :to="{ name: 'admin-courses' }" class="btn-ghost text-sm p-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </RouterLink>
      <div>
        <h1 class="text-xl font-bold text-surface-900">Edit Course</h1>
        <p class="text-xs text-surface-400 mt-0.5">ID: {{ id }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <form v-else @submit.prevent="save" class="space-y-5">

      <!-- Thumbnail -->
      <div class="card p-5">
        <label class="label">Course Thumbnail URL</label>
        <div class="flex items-start gap-4">
          <!-- Preview -->
          <div class="w-32 h-20 rounded-xl bg-gradient-to-br from-primary-900 to-accent-900 shrink-0 overflow-hidden flex items-center justify-center">
            <img v-if="form.thumbnail" :src="form.thumbnail" class="w-full h-full object-cover" />
            <span v-else class="text-3xl">🎓</span>
          </div>
          <!-- URL input -->
          <div class="flex-1 space-y-2">
            <input
              v-model="form.thumbnail"
              type="url"
              class="input"
              placeholder="https://i.ibb.co/your-image-url.jpg"
            />
            <div class="text-xs text-surface-400 space-y-0.5">
              <p>1. Upload image to <a href="https://imgbb.com" target="_blank" class="text-primary-600 hover:underline">imgbb.com</a> (free)</p>
              <p>2. Click "Direct link" → copy → paste above</p>
              <p class="text-surface-300">Recommended: 1280×720px JPG or PNG</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Basic info -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Course Details</h2>

        <div>
          <label class="label">Title</label>
          <input v-model="form.title" type="text" class="input" placeholder="Course title" required />
        </div>

        <div>
          <label class="label">Slug <span class="text-surface-400 font-normal">(URL path)</span></label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-surface-400">/courses/</span>
            <input v-model="form.slug" type="text" class="input flex-1" placeholder="veo3-ai-class" required />
          </div>
          <p class="text-xs text-surface-400 mt-1">Use lowercase letters and hyphens only. No spaces.</p>
        </div>

        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" rows="4" class="input resize-none" placeholder="What will students learn?" />
        </div>

        <div>
          <label class="label">Instructor name</label>
          <input v-model="form.instructor" type="text" class="input" />
        </div>
      </div>

      <!-- Pricing -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Pricing</h2>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="label">Price</label>
            <input v-model.number="form.price" type="number" min="0" class="input" />
          </div>
          <div class="w-28">
            <label class="label">Currency</label>
            <select v-model="form.currency" class="input">
              <option value="MMK">MMK</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <p class="text-xs text-surface-400">Set price to 0 for a free course.</p>
      </div>

      <!-- Settings -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Settings</h2>

        <div>
          <label class="label">Total Lessons</label>
          <input v-model.number="form.totalLessons" type="number" min="0" class="input w-32" />
          <p class="text-xs text-surface-400 mt-1">Update this after adding all lessons.</p>
        </div>

        <label class="flex items-center gap-3 cursor-pointer select-none">
          <div
            class="relative w-10 h-5 rounded-full transition-colors"
            :class="form.isPublished ? 'bg-primary-600' : 'bg-surface-300'"
            @click="form.isPublished = !form.isPublished"
          >
            <div
              class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              :class="form.isPublished ? 'translate-x-5' : 'translate-x-0'"
            />
          </div>
          <span class="text-sm font-medium text-surface-800">
            {{ form.isPublished ? 'Published (visible to students)' : 'Draft (hidden from students)' }}
          </span>
        </label>
      </div>

      <!-- Save bar -->
      <div class="flex items-center justify-between pt-2">
        <RouterLink :to="{ name: 'admin-lessons', params: { id } }" class="btn-ghost text-sm">
          Manage Lessons →
        </RouterLink>
        <div class="flex items-center gap-3">
          <button type="submit" :disabled="saving" class="btn-primary">
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Course' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
