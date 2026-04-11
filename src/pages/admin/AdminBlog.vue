<script setup>
// ─── AdminBlog ────────────────────────────────────────────────────────────────
// Admin list of all blog/vlog posts. Publish toggle, edit, delete per row.

import { ref, computed, onMounted } from 'vue'
import { RouterLink }               from 'vue-router'
import { useBlog }                  from '../../composables/useBlog'
import { useToast }                 from '../../composables/useToast'
import AppSpinner                   from '../../components/ui/AppSpinner.vue'

const toast = useToast()
const { posts, loading, fetchAllPosts, togglePublish, deletePost } = useBlog()

const activeTab  = ref('all')
const confirmDel = ref(null)

onMounted(() => fetchAllPosts())

const tabs = computed(() => [
  { key: 'all',       label: 'All',       count: posts.value.length },
  { key: 'blog',      label: 'Blog',      count: posts.value.filter(p => p.type === 'blog').length },
  { key: 'vlog',      label: 'Vlog',      count: posts.value.filter(p => p.type === 'vlog').length },
  { key: 'published', label: 'Published', count: posts.value.filter(p => p.isPublished).length },
  { key: 'draft',     label: 'Draft',     count: posts.value.filter(p => !p.isPublished).length },
])

const filtered = computed(() => {
  if (activeTab.value === 'all')       return posts.value
  if (activeTab.value === 'blog')      return posts.value.filter(p => p.type === 'blog')
  if (activeTab.value === 'vlog')      return posts.value.filter(p => p.type === 'vlog')
  if (activeTab.value === 'published') return posts.value.filter(p => p.isPublished)
  if (activeTab.value === 'draft')     return posts.value.filter(p => !p.isPublished)
  return posts.value
})

async function handleToggle(post) {
  try {
    await togglePublish(post.id, post.isPublished)
    toast.success(post.isPublished ? 'Post set to draft.' : 'Post published.')
  } catch {
    toast.error('Failed to update.')
  }
}

async function handleDelete(id) {
  try {
    await deletePost(id)
    confirmDel.value = null
    toast.success('Post deleted.')
  } catch {
    toast.error('Failed to delete.')
  }
}

function formatDate(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Blog & Vlogs</h1>
        <p class="text-xs text-surface-400 mt-0.5">Manage articles and video content</p>
      </div>
      <RouterLink :to="{ name: 'admin-blog-new' }" class="btn-primary text-sm">+ New Post</RouterLink>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit mb-6 flex-wrap">
      <button
        v-for="tab in tabs" :key="tab.key"
        @click="activeTab = tab.key"
        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize"
        :class="activeTab === tab.key ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'"
      >
        {{ tab.label }}
        <span class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
          :class="activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-surface-200 text-surface-500'">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

    <div v-else-if="filtered.length === 0" class="card p-10 text-center text-surface-400">
      <p class="text-3xl mb-2">📝</p>
      <p class="font-medium text-surface-600">No posts yet.</p>
      <p class="text-sm mt-1">Click "+ New Post" to create the first one.</p>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-200 bg-surface-50">
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Post</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden md:table-cell">Categories</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr v-for="post in filtered" :key="post.id" class="hover:bg-surface-50 transition-colors">
            <!-- Post info -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div v-if="post.coverImageUrl" class="w-12 h-9 rounded-lg overflow-hidden shrink-0 bg-surface-100">
                  <img :src="post.coverImageUrl" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-12 h-9 rounded-lg bg-surface-100 flex items-center justify-center shrink-0 text-surface-400 text-lg">
                  {{ post.type === 'vlog' ? '▶' : '📄' }}
                </div>
                <div>
                  <p class="font-semibold text-surface-900 truncate max-w-[180px]">{{ post.title }}</p>
                  <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                    :class="post.type === 'vlog' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                    {{ post.type === 'vlog' ? 'Vlog' : 'Blog' }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Categories -->
            <td class="px-4 py-3 hidden md:table-cell">
              <div class="flex flex-wrap gap-1 max-w-[160px]">
                <span v-for="cat in (post.categories || []).slice(0, 2)" :key="cat"
                  class="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                  {{ cat }}
                </span>
                <span v-if="(post.categories || []).length > 2" class="text-xs text-surface-400">
                  +{{ post.categories.length - 2 }}
                </span>
              </div>
            </td>

            <!-- Date -->
            <td class="px-4 py-3 text-surface-500 text-xs hidden sm:table-cell">
              {{ formatDate(post.publishedAt || post.createdAt) }}
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                :class="post.isPublished ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'">
                <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="post.isPublished ? 'bg-success-500' : 'bg-surface-400'" />
                {{ post.isPublished ? 'Published' : 'Draft' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2 flex-wrap">
                <button @click="handleToggle(post)"
                  class="text-xs btn-ghost border border-surface-200 whitespace-nowrap">
                  {{ post.isPublished ? 'Unpublish' : 'Publish' }}
                </button>
                <RouterLink :to="{ name: 'admin-blog-edit', params: { id: post.id } }"
                  class="text-xs btn-ghost border border-surface-200">
                  Edit
                </RouterLink>
                <template v-if="confirmDel !== post.id">
                  <button @click="confirmDel = post.id" class="text-xs text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </template>
                <template v-else>
                  <button @click="handleDelete(post.id)" class="text-xs text-red-600 font-semibold">Confirm</button>
                  <button @click="confirmDel = null" class="text-xs text-surface-400">Cancel</button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
