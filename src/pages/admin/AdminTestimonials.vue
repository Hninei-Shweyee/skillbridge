<script setup>
// ─── AdminTestimonials ────────────────────────────────────────────────────────
// Admin manages testimonials per course. Published ones appear on course detail page.

import { ref, onMounted, computed } from 'vue'
import { useTestimonials }          from '../../composables/useTestimonials'
import { useToast }                 from '../../composables/useToast'
import { db }                       from '../../firebase/config'
import { getDocs, collection }      from 'firebase/firestore'
import AppSpinner                   from '../../components/ui/AppSpinner.vue'

const toast = useToast()
const { testimonials, loading, fetchAllTestimonials, addTestimonial, updateTestimonial, togglePublish, deleteTestimonial } = useTestimonials()

const courses       = ref([])
const filterCourse  = ref('all')
const showForm      = ref(false)
const saving        = ref(false)
const editingId     = ref(null)
const confirmDel    = ref(null)

const form = ref({
  courseId: '', studentName: '', studentAvatar: '', content: '', rating: 5, isPublished: true,
})

onMounted(async () => {
  // Load all courses for the filter dropdown
  const snap = await getDocs(collection(db, 'courses'))
  courses.value = snap.docs
    .filter(d => d.data().isPublished === true)
    .map(d => ({ id: d.id, title: d.data().title }))
  if (courses.value.length > 0) form.value.courseId = courses.value[0].id
  await fetchAllTestimonials(null)
})

const filtered = computed(() => {
  if (filterCourse.value === 'all') return testimonials.value
  return testimonials.value.filter(t => t.courseId === filterCourse.value)
})

function resetForm() {
  form.value = {
    courseId: courses.value[0]?.id || '',
    studentName: '', studentAvatar: '', content: '', rating: 5, isPublished: true,
  }
  editingId.value = null
  showForm.value  = false
}

function startEdit(t) {
  form.value = {
    courseId:      t.courseId,
    studentName:   t.studentName,
    studentAvatar: t.studentAvatar || '',
    content:       t.content,
    rating:        t.rating,
    isPublished:   t.isPublished,
  }
  editingId.value = t.id
  showForm.value  = true
}

async function handleSave() {
  if (!form.value.studentName.trim() || !form.value.content.trim() || !form.value.courseId) {
    toast.error('Please fill in student name, course, and review content.')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateTestimonial(editingId.value, { ...form.value })
      const idx = testimonials.value.findIndex(t => t.id === editingId.value)
      if (idx !== -1) Object.assign(testimonials.value[idx], form.value)
      toast.success('Testimonial updated.')
    } else {
      await addTestimonial({ ...form.value })
      await fetchAllTestimonials(null)
      toast.success('Testimonial added.')
    }
    resetForm()
  } catch {
    toast.error('Failed to save. Please try again.')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteTestimonial(id)
    confirmDel.value = null
    toast.success('Testimonial deleted.')
  } catch {
    toast.error('Failed to delete.')
  }
}

function courseTitle(courseId) {
  return courses.value.find(c => c.id === courseId)?.title || courseId
}
</script>

<template>
  <div class="animate-fade-in max-w-3xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Testimonials</h1>
        <p class="text-xs text-surface-400 mt-0.5">Published testimonials appear on course detail pages</p>
      </div>
      <button @click="showForm && !editingId ? resetForm() : (showForm = true, editingId = null)" class="btn-primary text-sm">
        {{ showForm && !editingId ? 'Cancel' : '+ Add Testimonial' }}
      </button>
    </div>

    <!-- Add / Edit form -->
    <div v-if="showForm" class="card p-5 space-y-4 mb-6 border-2 border-primary-200 bg-primary-50/30">
      <h2 class="font-semibold text-surface-900 text-sm">
        {{ editingId ? 'Edit Testimonial' : 'New Testimonial' }}
      </h2>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Course <span class="text-red-500">*</span></label>
          <select v-model="form.courseId" class="input">
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
        </div>
        <div>
          <label class="label">Rating</label>
          <select v-model.number="form.rating" class="input">
            <option :value="5">⭐⭐⭐⭐⭐ (5)</option>
            <option :value="4">⭐⭐⭐⭐ (4)</option>
            <option :value="3">⭐⭐⭐ (3)</option>
            <option :value="2">⭐⭐ (2)</option>
            <option :value="1">⭐ (1)</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Student Name <span class="text-red-500">*</span></label>
          <input v-model="form.studentName" type="text" class="input" placeholder="Mg Aung" />
        </div>
        <div>
          <label class="label">Avatar URL <span class="text-surface-400 font-normal">(optional)</span></label>
          <input v-model="form.studentAvatar" type="url" class="input" placeholder="https://i.ibb.co/..." />
        </div>
      </div>

      <div>
        <label class="label">Review Content <span class="text-red-500">*</span></label>
        <textarea v-model="form.content" rows="3" class="input resize-none" placeholder="Write the student's review here…" />
      </div>

      <label class="flex items-center gap-3 cursor-pointer select-none">
        <div
          class="relative w-10 h-5 rounded-full transition-colors"
          :class="form.isPublished ? 'bg-primary-600' : 'bg-surface-300'"
          @click="form.isPublished = !form.isPublished"
        >
          <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            :class="form.isPublished ? 'translate-x-5' : 'translate-x-0'" />
        </div>
        <span class="text-sm font-medium text-surface-800">
          {{ form.isPublished ? 'Published (visible on course page)' : 'Draft (hidden)' }}
        </span>
      </label>

      <div class="flex gap-3 pt-2">
        <button @click="handleSave" :disabled="saving" class="btn-primary">
          <svg v-if="saving" class="w-4 h-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ saving ? 'Saving…' : (editingId ? 'Update' : 'Add Testimonial') }}
        </button>
        <button @click="resetForm" class="btn-ghost">Cancel</button>
      </div>
    </div>

    <!-- Filter by course -->
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <button
        @click="filterCourse = 'all'"
        class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
        :class="filterCourse === 'all' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'"
      >All Courses</button>
      <button
        v-for="c in courses" :key="c.id"
        @click="filterCourse = c.id"
        class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors truncate max-w-[160px]"
        :class="filterCourse === c.id ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'"
      >{{ c.title }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12"><AppSpinner /></div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="card p-10 text-center text-surface-400">
      <p class="text-3xl mb-2">💬</p>
      <p class="font-medium text-surface-600">No testimonials yet.</p>
      <p class="text-sm mt-1">Click "+ Add Testimonial" to add the first review.</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div v-for="t in filtered" :key="t.id" class="card p-4">
        <div class="flex items-start gap-3">
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
            <img v-if="t.studentAvatar" :src="t.studentAvatar" class="w-full h-full object-cover" />
            <span v-else>{{ t.studentName?.charAt(0)?.toUpperCase() }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-surface-900 text-sm">{{ t.studentName }}</span>
              <span class="text-xs text-surface-400">{{ courseTitle(t.courseId) }}</span>
              <span class="text-xs">{{ '⭐'.repeat(t.rating) }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="t.isPublished ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'">
                {{ t.isPublished ? 'Published' : 'Draft' }}
              </span>
            </div>
            <p class="text-sm text-surface-600 mt-1">{{ t.content }}</p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-1.5 shrink-0 text-right">
            <button @click="togglePublish(t.id, t.isPublished)" class="text-xs btn-ghost border border-surface-200">
              {{ t.isPublished ? 'Unpublish' : 'Publish' }}
            </button>
            <button @click="startEdit(t)" class="text-xs btn-ghost border border-surface-200">Edit</button>
            <button
              v-if="confirmDel !== t.id"
              @click="confirmDel = t.id"
              class="text-xs text-red-500 hover:text-red-700"
            >Delete</button>
            <template v-else>
              <button @click="handleDelete(t.id)" class="text-xs text-red-600 font-semibold">Confirm</button>
              <button @click="confirmDel = null" class="text-xs text-surface-400">Cancel</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
