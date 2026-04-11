<script setup>
// ─── AdminBlogEdit ────────────────────────────────────────────────────────────
// Create or edit a blog/vlog post.
// Route params: id (edit mode) or none (new mode)

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db }                  from '../../firebase/config'
import { doc, getDoc }         from 'firebase/firestore'
import { useBlog } from '../../composables/useBlog'
import { useToast }            from '../../composables/useToast'
import AppSpinner              from '../../components/ui/AppSpinner.vue'

const route  = useRoute()
const router = useRouter()
const toast  = useToast()
const { addPost, updatePost } = useBlog()

const postId  = route.params.id   // undefined for new post
const loading = ref(!!postId)
const saving  = ref(false)

const form = ref({
  type:           'blog',
  title:          '',
  excerpt:        '',
  content:        '',
  coverImageUrl:  '',
  videoUrl:       '',
  categories:     [],
  authorName:     'SkillBridge Team',
  authorAvatarUrl:'',
  isPublished:    false,
})

onMounted(async () => {
  if (!postId) return
  const snap = await getDoc(doc(db, 'blogPosts', postId))
  if (snap.exists()) {
    const data = snap.data()
    form.value = {
      type:            data.type           ?? 'blog',
      title:           data.title          ?? '',
      excerpt:         data.excerpt        ?? '',
      content:         data.content        ?? '',
      coverImageUrl:   data.coverImageUrl  ?? '',
      videoUrl:        data.videoUrl       ?? '',
      categories:      data.categories     ?? [],
      authorName:      data.authorName     ?? 'SkillBridge Team',
      authorAvatarUrl: data.authorAvatarUrl ?? '',
      isPublished:     data.isPublished    ?? false,
    }
  }
  loading.value = false
})

const newCategory = ref('')

function addCategory() {
  const val = newCategory.value.trim()
  if (!val || form.value.categories.includes(val)) return
  form.value.categories.push(val)
  newCategory.value = ''
}

function removeCategory(cat) {
  form.value.categories = form.value.categories.filter(c => c !== cat)
}

async function handleSave() {
  if (!form.value.title.trim()) {
    toast.error('Title is required.')
    return
  }
  saving.value = true
  try {
    if (postId) {
      await updatePost(postId, { ...form.value })
      toast.success('Post updated.')
    } else {
      await addPost({ ...form.value })
      toast.success('Post created.')
    }
    router.push({ name: 'admin-blog' })
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
      <RouterLink :to="{ name: 'admin-blog' }" class="btn-ghost text-sm p-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </RouterLink>
      <div>
        <h1 class="text-xl font-bold text-surface-900">{{ postId ? 'Edit Post' : 'New Post' }}</h1>
        <p class="text-xs text-surface-400 mt-0.5">{{ postId ? `ID: ${postId}` : 'Create a new blog or vlog post' }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <form v-else @submit.prevent="handleSave" class="space-y-5">

      <!-- ── Type Selector ─────────────────────────────────────────────── -->
      <div class="card p-5">
        <h2 class="font-semibold text-surface-900 text-sm mb-3">Content Type</h2>
        <div class="flex gap-3">
          <button
            type="button"
            @click="form.type = 'blog'"
            class="flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all"
            :class="form.type === 'blog'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-surface-200 text-surface-600 hover:border-surface-300'"
          >
            📄 Blog Article
          </button>
          <button
            type="button"
            @click="form.type = 'vlog'"
            class="flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all"
            :class="form.type === 'vlog'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-surface-200 text-surface-600 hover:border-surface-300'"
          >
            ▶ Video Blog (Vlog)
          </button>
        </div>
      </div>

      <!-- ── Basic Info ─────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Basic Info</h2>

        <div>
          <label class="label">Title <span class="text-red-500">*</span></label>
          <input v-model="form.title" type="text" class="input" placeholder="Why IT Knowledge Matters in 2026" required />
        </div>

        <div>
          <label class="label">Excerpt <span class="text-surface-400 font-normal">(shown on listing cards)</span></label>
          <textarea v-model="form.excerpt" rows="2" class="input resize-none"
            placeholder="A short 1–2 sentence summary of this post…" />
        </div>

        <div>
          <label class="label">Author Name</label>
          <input v-model="form.authorName" type="text" class="input" placeholder="SkillBridge Team" />
        </div>

        <div>
          <label class="label">Author Avatar URL <span class="text-surface-400 font-normal">(optional)</span></label>
          <input v-model="form.authorAvatarUrl" type="url" class="input" placeholder="https://i.ibb.co/..." />
        </div>
      </div>

      <!-- ── Video URL (vlog only) ──────────────────────────────────────── -->
      <div v-if="form.type === 'vlog'" class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Video</h2>
        <div>
          <label class="label">YouTube / Vimeo URL <span class="text-red-500">*</span></label>
          <input v-model="form.videoUrl" type="url" class="input" placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      </div>

      <!-- ── Cover Image ────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">
          {{ form.type === 'vlog' ? 'Thumbnail Image' : 'Cover Image' }}
        </h2>
        <div>
          <label class="label">Image URL</label>
          <input v-model="form.coverImageUrl" type="url" class="input" placeholder="https://i.ibb.co/..." />
        </div>
        <div v-if="form.coverImageUrl" class="mt-2">
          <img :src="form.coverImageUrl" class="w-full max-h-48 object-cover rounded-xl border border-surface-200" />
        </div>
      </div>

      <!-- ── Content (blog only) ───────────────────────────────────────── -->
      <div v-if="form.type === 'blog'" class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Article Content</h2>
        <div>
          <label class="label">Content <span class="text-surface-400 font-normal">(use blank lines to separate paragraphs)</span></label>
          <textarea v-model="form.content" rows="12" class="input resize-y font-mono text-sm"
            placeholder="Write your article here…&#10;&#10;Use blank lines to separate paragraphs." />
        </div>
      </div>

      <!-- ── Description (vlog optional) ───────────────────────────────── -->
      <div v-if="form.type === 'vlog'" class="card p-5 space-y-4">
        <h2 class="font-semibold text-surface-900 text-sm">Description <span class="text-surface-400 font-normal">(optional)</span></h2>
        <textarea v-model="form.content" rows="5" class="input resize-none"
          placeholder="Optional description shown below the video…" />
      </div>

      <!-- ── Categories ────────────────────────────────────────────────── -->
      <div class="card p-5 space-y-3">
        <h2 class="font-semibold text-surface-900 text-sm">Categories</h2>

        <!-- Added tags -->
        <div class="flex flex-wrap gap-2 min-h-[32px]">
          <span
            v-for="cat in form.categories" :key="cat"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-medium"
          >
            {{ cat }}
            <button type="button" @click="removeCategory(cat)"
              class="text-primary-500 hover:text-primary-900 leading-none text-base font-bold">
              ×
            </button>
          </span>
          <p v-if="form.categories.length === 0" class="text-xs text-surface-400 self-center">
            No categories added yet.
          </p>
        </div>

        <!-- Add input -->
        <div class="flex gap-2">
          <input
            v-model="newCategory"
            type="text"
            class="input flex-1"
            placeholder="Type a category and press Add…"
            @keydown.enter.prevent="addCategory"
          />
          <button type="button" @click="addCategory" class="btn-secondary text-sm whitespace-nowrap">
            + Add
          </button>
        </div>
        <p class="text-xs text-surface-400">Press Enter or click Add. Examples: IT Knowledge, AI Tools, Tutorials</p>
      </div>

      <!-- ── Publish Status ─────────────────────────────────────────────── -->
      <div
        class="card p-5 flex items-center justify-between gap-4 border-2 cursor-pointer select-none"
        :class="form.isPublished ? 'border-success-300 bg-success-50/40' : 'border-surface-200 bg-surface-50'"
        @click="form.isPublished = !form.isPublished"
      >
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full shrink-0" :class="form.isPublished ? 'bg-success-500' : 'bg-surface-400'" />
          <div>
            <p class="font-semibold text-surface-900">{{ form.isPublished ? 'Published' : 'Draft' }}</p>
            <p class="text-xs text-surface-500 mt-0.5">
              {{ form.isPublished ? 'Visible to everyone on /blog' : 'Hidden — save to keep as draft.' }}
            </p>
          </div>
        </div>
        <div class="relative w-14 h-7 rounded-full transition-colors shrink-0"
          :class="form.isPublished ? 'bg-success-500' : 'bg-surface-300'">
          <div class="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform"
            :class="form.isPublished ? 'translate-x-7' : 'translate-x-0'" />
        </div>
      </div>

      <!-- ── Save bar ───────────────────────────────────────────────────── -->
      <div class="sticky bottom-0 bg-white border-t border-surface-200 -mx-4 px-4 py-3 flex items-center justify-between gap-3">
        <RouterLink :to="{ name: 'admin-blog' }" class="btn-ghost text-sm">← Back</RouterLink>
        <div class="flex items-center gap-3">
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
          <button type="submit" :disabled="saving" class="btn-primary">
            <svg v-if="saving" class="w-4 h-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Post' }}
          </button>
        </div>
      </div>

    </form>
  </div>
</template>
