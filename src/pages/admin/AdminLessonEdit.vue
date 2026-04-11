<script setup>
// ─── AdminLessonEdit ──────────────────────────────────────────────────────────
// Full lesson editor. All fields:
//   - Title, order, published toggle
//   - Main video (YouTube/Vimeo URL + duration)
//   - Resource files (add by URL or upload)
//   - PDFs (add by URL or upload)
//   - Extra videos (up to 3 short videos)
//   - Q&A toggle + optional Q&A URL
//   - Community links
//   Admin saves → lesson immediately visible in student viewer.

import { ref, onMounted }      from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db }                  from '../../firebase/config'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import AppSpinner              from '../../components/ui/AppSpinner.vue'
import { useToast }            from '../../composables/useToast'

const toast    = useToast()
const route    = useRoute()
const router   = useRouter()
const courseId = route.params.id
const lessonId = route.params.lessonId

const loading  = ref(true)
const saving   = ref(false)

// New resource/pdf URL form state
const newResourceName = ref('')
const newResourceUrl  = ref('')
const newResourceType = ref('PDF')
const newPdfName      = ref('')
const newPdfUrl       = ref('')

// ─── Form state ───────────────────────────────────────────────────────────────
const form = ref({
  title:         '',
  order:         1,
  isPublished:   false,
  qaEnabled:     true,
  qaUrl:         '',
  mainVideo:     { type: 'youtube', url: '', duration: 0 },
  resourceFiles: [],  // [{ name, url, type }]
  pdfs:          [],  // [{ name, url }]
  extraVideos:   [],  // [{ title, url, type, duration }]
  communityLinks:[], // [{ label, url, icon }]
})


onMounted(async () => {
  const snap = await getDoc(doc(db, `courses/${courseId}/lessons`, lessonId))
  if (snap.exists()) {
    const data = snap.data()
    // Merge carefully so nested arrays/objects are intact
    form.value = {
      ...form.value,
      ...data,
      mainVideo:      data.mainVideo      ?? form.value.mainVideo,
      resourceFiles:  data.resourceFiles  ?? [],
      pdfs:           data.pdfs           ?? [],
      extraVideos:    data.extraVideos    ?? [],
      communityLinks: data.communityLinks ?? [],
    }
  }
  loading.value = false
})

// ─── Save ─────────────────────────────────────────────────────────────────────
async function save() {
  saving.value = true
  try {
    await updateDoc(doc(db, `courses/${courseId}/lessons`, lessonId), {
      ...form.value,
      updatedAt: serverTimestamp(),
    })
    toast.success('Lesson saved!')
  } catch {
    toast.error('Failed to save. Please try again.')
  } finally {
    saving.value = false
  }
}

// ─── Add resource file by URL ─────────────────────────────────────────────────
function addResourceFile() {
  if (!newResourceName.value.trim() || !newResourceUrl.value.trim()) return
  form.value.resourceFiles.push({
    name: newResourceName.value.trim(),
    url:  newResourceUrl.value.trim(),
    type: newResourceType.value,
  })
  newResourceName.value = ''
  newResourceUrl.value  = ''
}

// ─── Add PDF by URL ───────────────────────────────────────────────────────────
function addPdf() {
  if (!newPdfName.value.trim() || !newPdfUrl.value.trim()) return
  form.value.pdfs.push({
    name: newPdfName.value.trim(),
    url:  newPdfUrl.value.trim(),
  })
  newPdfName.value = ''
  newPdfUrl.value  = ''
}

// ─── Extra videos ─────────────────────────────────────────────────────────────
function addExtraVideo() {
  if (form.value.extraVideos.length >= 3) return
  form.value.extraVideos.push({ title: '', url: '', type: 'youtube', duration: 0 })
}
function removeExtraVideo(i) {
  form.value.extraVideos.splice(i, 1)
}

// ─── Community links ──────────────────────────────────────────────────────────
function addCommunityLink() {
  form.value.communityLinks.push({ label: '', url: '', icon: 'link' })
}
function removeCommunityLink(i) {
  form.value.communityLinks.splice(i, 1)
}

// ─── Remove helpers ───────────────────────────────────────────────────────────
function removeResource(i) { form.value.resourceFiles.splice(i, 1) }
function removePdf(i)      { form.value.pdfs.splice(i, 1) }
</script>

<template>
  <div class="animate-fade-in max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <RouterLink :to="{ name: 'admin-lessons', params: { id: courseId } }" class="btn-ghost text-sm p-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </RouterLink>
      <div>
        <h1 class="text-xl font-bold text-surface-900">Edit Lesson</h1>
        <p class="text-xs text-surface-400 mt-0.5">ID: {{ lessonId }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <form v-else @submit.prevent="save" class="space-y-5">

      <!-- ── Basic Info ─────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Basic Info</h2>

        <div>
          <label class="label">Lesson Title</label>
          <input v-model="form.title" type="text" class="input" placeholder="Day-1 Essential AI Tools" required />
        </div>

        <div class="w-28">
          <label class="label">Order</label>
          <input v-model.number="form.order" type="number" min="1" class="input" />
        </div>
      </div>

      <!-- ── Publish Status ────────────────────────────────────────────── -->
      <div
        class="card p-5 flex items-center justify-between gap-4 border-2 cursor-pointer select-none"
        :class="form.isPublished ? 'border-success-300 bg-success-50/40' : 'border-surface-200 bg-surface-50'"
        @click="form.isPublished = !form.isPublished"
      >
        <div class="flex items-center gap-3">
          <!-- Status dot -->
          <div class="w-3 h-3 rounded-full shrink-0" :class="form.isPublished ? 'bg-success-500' : 'bg-surface-400'" />
          <div>
            <p class="font-semibold text-surface-900">
              {{ form.isPublished ? 'Published' : 'Draft' }}
            </p>
            <p class="text-xs text-surface-500 mt-0.5">
              {{ form.isPublished ? 'Students can see and access this lesson.' : 'Hidden from students — save to keep as draft.' }}
            </p>
          </div>
        </div>
        <!-- Big toggle -->
        <div
          class="relative w-14 h-7 rounded-full transition-colors shrink-0"
          :class="form.isPublished ? 'bg-success-500' : 'bg-surface-300'"
        >
          <div
            class="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform"
            :class="form.isPublished ? 'translate-x-7' : 'translate-x-0'"
          />
        </div>
      </div>

      <!-- ── Main Video ─────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Main Video <span class="text-surface-400 font-normal">(~1 hr recorded lesson)</span></h2>

        <div class="flex gap-3">
          <div class="w-32">
            <label class="label">Provider</label>
            <select v-model="form.mainVideo.type" class="input">
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="label">Video URL</label>
            <input v-model="form.mainVideo.url" type="url" class="input" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
        </div>

        <div class="w-36">
          <label class="label">Duration (minutes)</label>
          <input v-model.number="form.mainVideo.duration" type="number" min="0" class="input" />
        </div>
      </div>

      <!-- ── Resource Files ─────────────────────────────────────────────── -->
      <div class="card p-5 space-y-3">
        <h2 class="font-semibold text-surface-900 text-sm">Resource Files <span class="text-surface-400 font-normal">(zip, xlsx, pptx…)</span></h2>

        <div v-for="(f, i) in form.resourceFiles" :key="i" class="flex items-center gap-2 p-2 rounded-lg bg-surface-50 border border-surface-200 text-sm">
          <span class="flex-1 truncate font-medium text-surface-800">{{ f.name }}</span>
          <span class="text-xs text-surface-400 uppercase">{{ f.type }}</span>
          <button type="button" @click="removeResource(i)" class="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
        </div>

        <!-- Add resource by URL -->
        <div class="rounded-xl border border-dashed border-surface-300 p-4 space-y-3 bg-surface-50">
          <p class="text-xs font-medium text-surface-600">Add Resource File</p>
          <div class="flex gap-2">
            <input v-model="newResourceName" type="text" class="input flex-1" placeholder="File name (e.g. Day-1 Template.xlsx)" />
            <select v-model="newResourceType" class="input w-24">
              <option>PDF</option>
              <option>XLSX</option>
              <option>PPTX</option>
              <option>ZIP</option>
              <option>DOCX</option>
              <option>OTHER</option>
            </select>
          </div>
          <div class="flex gap-2">
            <input v-model="newResourceUrl" type="url" class="input flex-1" placeholder="https://drive.google.com/uc?export=download&id=..." />
            <button type="button" @click="addResourceFile" class="btn-secondary text-xs whitespace-nowrap">+ Add</button>
          </div>
          <p class="text-xs text-surface-400">Upload to Google Drive → Share (Anyone with link) → copy direct download link</p>
        </div>
      </div>

      <!-- ── PDFs ───────────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-3">
        <h2 class="font-semibold text-surface-900 text-sm">Day PDFs</h2>

        <div v-for="(pdf, i) in form.pdfs" :key="i" class="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 text-sm">
          <span class="flex-1 truncate font-medium text-surface-800">{{ pdf.name }}</span>
          <button type="button" @click="removePdf(i)" class="text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>

        <!-- Add PDF by URL -->
        <div class="rounded-xl border border-dashed border-surface-300 p-4 space-y-3 bg-surface-50">
          <p class="text-xs font-medium text-surface-600">Add PDF</p>
          <input v-model="newPdfName" type="text" class="input" placeholder="PDF name (e.g. Day-1 Slides.pdf)" />
          <div class="flex gap-2">
            <input v-model="newPdfUrl" type="url" class="input flex-1" placeholder="https://drive.google.com/uc?export=download&id=..." />
            <button type="button" @click="addPdf" class="btn-secondary text-xs whitespace-nowrap">+ Add</button>
          </div>
          <p class="text-xs text-surface-400">Upload PDF to Google Drive → Share (Anyone with link) → copy direct download link</p>
        </div>
      </div>

      <!-- ── Extra Videos ───────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-surface-900 text-sm">Extra Resource Videos <span class="text-surface-400 font-normal">(max 3)</span></h2>
          <button
            v-if="form.extraVideos.length < 3"
            type="button"
            @click="addExtraVideo"
            class="btn-ghost text-xs border border-surface-200"
          >
            + Add Video
          </button>
        </div>

        <div v-if="form.extraVideos.length === 0" class="text-sm text-surface-400">
          No extra videos yet. Click "+ Add Video" to add short resource clips.
        </div>

        <div v-for="(v, i) in form.extraVideos" :key="i" class="rounded-xl border border-surface-200 p-4 space-y-3 bg-surface-50">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-surface-500">Video {{ i + 1 }}</span>
            <button type="button" @click="removeExtraVideo(i)" class="text-xs text-red-400 hover:text-red-600">Remove</button>
          </div>

          <div>
            <label class="label">Title</label>
            <input v-model="v.title" type="text" class="input" placeholder="e.g. Quick Veo3 Tips" />
          </div>

          <div class="flex gap-3">
            <div class="w-32">
              <label class="label">Provider</label>
              <select v-model="v.type" class="input">
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="label">URL</label>
              <input v-model="v.url" type="url" class="input" placeholder="https://..." />
            </div>
            <div class="w-24">
              <label class="label">Mins</label>
              <input v-model.number="v.duration" type="number" min="0" class="input" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Q&A ────────────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Q&A</h2>

        <label class="flex items-center gap-3 cursor-pointer select-none">
          <div
            class="relative w-10 h-5 rounded-full transition-colors"
            :class="form.qaEnabled ? 'bg-primary-600' : 'bg-surface-300'"
            @click="form.qaEnabled = !form.qaEnabled"
          >
            <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              :class="form.qaEnabled ? 'translate-x-5' : 'translate-x-0'" />
          </div>
          <span class="text-sm font-medium text-surface-800">
            {{ form.qaEnabled ? 'Q&A enabled' : 'Q&A disabled' }}
          </span>
        </label>

        <div v-if="form.qaEnabled">
          <label class="label">Q&A Form URL <span class="text-surface-400 font-normal">(optional — Google Form, Typeform…)</span></label>
          <input v-model="form.qaUrl" type="url" class="input" placeholder="https://forms.google.com/..." />
        </div>
      </div>

      <!-- ── Community Links ────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-surface-900 text-sm">Community Links</h2>
          <button type="button" @click="addCommunityLink" class="btn-ghost text-xs border border-surface-200">
            + Add Link
          </button>
        </div>

        <div v-if="form.communityLinks.length === 0" class="text-sm text-surface-400">
          No links yet. Add Telegram, Facebook Group, Discord, etc.
        </div>

        <div v-for="(link, i) in form.communityLinks" :key="i" class="rounded-xl border border-surface-200 p-4 space-y-3 bg-surface-50">
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-surface-500">Link {{ i + 1 }}</span>
            <button type="button" @click="removeCommunityLink(i)" class="text-xs text-red-400 hover:text-red-600">Remove</button>
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="label">Label</label>
              <input v-model="link.label" type="text" class="input" placeholder="Join Telegram Group" />
            </div>
            <div class="w-32">
              <label class="label">Icon</label>
              <select v-model="link.icon" class="input">
                <option value="telegram">Telegram</option>
                <option value="facebook">Facebook</option>
                <option value="discord">Discord</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="youtube">YouTube</option>
                <option value="link">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label class="label">URL</label>
            <input v-model="link.url" type="url" class="input" placeholder="https://t.me/..." />
          </div>
        </div>
      </div>

      <!-- ── Save bar ───────────────────────────────────────────────────── -->
      <div class="sticky bottom-0 bg-white border-t border-surface-200 -mx-4 px-4 py-3 flex items-center justify-between gap-3">
        <RouterLink :to="{ name: 'admin-lessons', params: { id: courseId } }" class="btn-ghost text-sm">
          ← Back
        </RouterLink>
        <div class="flex items-center gap-3">
          <!-- Publish / Unpublish quick toggle -->
          <button
            type="button"
            @click="form.isPublished = !form.isPublished"
            class="text-sm px-4 py-2 rounded-xl font-medium border transition-colors"
            :class="form.isPublished
              ? 'border-surface-300 text-surface-600 hover:bg-surface-50'
              : 'border-success-400 text-success-700 bg-success-50 hover:bg-success-100'"
          >
            {{ form.isPublished ? 'Set to Draft' : '🌐 Publish' }}
          </button>
          <!-- Save -->
          <button type="submit" :disabled="saving" class="btn-primary">
            <svg v-if="saving" class="w-4 h-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Lesson' }}
          </button>
        </div>
      </div>

    </form>
  </div>
</template>
