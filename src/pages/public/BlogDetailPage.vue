<script setup>
// ─── BlogDetailPage ───────────────────────────────────────────────────────────
// Displays a single blog or vlog post. Fetches by slug.
// Shows prev/next navigation and similar posts section.

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink }            from 'vue-router'
import { useBlog }                         from '../../composables/useBlog'
import AppSpinner                          from '../../components/ui/AppSpinner.vue'

const route = useRoute()
const { fetchPostBySlug, fetchPublishedPosts, getSimilarPosts } = useBlog()

const post        = ref(null)
const allPosts    = ref([])
const similar     = ref([])
const loading     = ref(true)
const notFound    = ref(false)

onMounted(() => loadPost())
watch(() => route.params.slug, () => loadPost())

async function loadPost() {
  loading.value  = true
  notFound.value = false
  post.value     = null
  similar.value  = []

  const slug = route.params.slug
  const found = await fetchPostBySlug(slug)
  if (!found || !found.isPublished) {
    notFound.value = true
    loading.value  = false
    return
  }
  post.value = found

  // Fetch all published posts for prev/next
  const { posts: allRef, fetchPublishedPosts: fetchAll } = useBlog()
  await fetchAll()
  allPosts.value = allRef.value

  // Similar posts
  similar.value = await getSimilarPosts(found.id, found.categories)

  loading.value = false
}

const currentIndex = computed(() =>
  allPosts.value.findIndex(p => p.id === post.value?.id)
)
const prevPost = computed(() =>
  currentIndex.value < allPosts.value.length - 1 ? allPosts.value[currentIndex.value + 1] : null
)
const nextPost = computed(() =>
  currentIndex.value > 0 ? allPosts.value[currentIndex.value - 1] : null
)

// Split content into paragraphs by blank lines
const paragraphs = computed(() =>
  (post.value?.content || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
)

// Convert YouTube/Vimeo URL to embed URL
function toEmbedUrl(url) {
  if (!url) return ''
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

function formatDate(ts) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-24"><AppSpinner size="lg" /></div>

    <!-- Not found -->
    <div v-else-if="notFound" class="container-app py-24 text-center">
      <p class="text-5xl mb-4">📭</p>
      <h2 class="text-2xl font-bold text-surface-900 mb-2">Post not found</h2>
      <RouterLink :to="{ name: 'blog' }" class="btn-primary mt-4">← Back to Blog</RouterLink>
    </div>

    <!-- Post content -->
    <div v-else-if="post">

      <!-- ── Hero ──────────────────────────────────────────────────────── -->
      <section class="bg-surface-900 py-14">
        <div class="container-app max-w-3xl">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-xs text-surface-400 mb-6">
            <RouterLink :to="{ name: 'blog' }" class="hover:text-primary-400 transition-colors">Blog</RouterLink>
            <span>›</span>
            <span v-if="post.categories?.[0]" class="text-surface-300">{{ post.categories[0] }}</span>
          </div>

          <!-- Type + categories -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs px-2.5 py-1 rounded-full font-semibold"
              :class="post.type === 'vlog' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'">
              {{ post.type === 'vlog' ? 'Vlog' : 'Blog' }}
            </span>
            <span v-for="cat in post.categories" :key="cat"
              class="text-xs px-2.5 py-1 rounded-full bg-primary-900/60 text-primary-300 border border-primary-700/40">
              {{ cat }}
            </span>
          </div>

          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
            {{ post.title }}
          </h1>

          <!-- Author + date -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-700 overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0">
              <img v-if="post.authorAvatarUrl" :src="post.authorAvatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ post.authorName?.charAt(0)?.toUpperCase() ?? 'S' }}</span>
            </div>
            <div>
              <p class="text-white font-semibold text-sm">{{ post.authorName }}</p>
              <p class="text-surface-400 text-xs">{{ formatDate(post.publishedAt) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Main content ───────────────────────────────────────────────── -->
      <section class="section bg-white">
        <div class="container-app max-w-3xl">

          <!-- Video embed (vlog) -->
          <div v-if="post.type === 'vlog' && post.videoUrl"
            class="mb-8 rounded-2xl overflow-hidden shadow-lg aspect-video">
            <iframe
              :src="toEmbedUrl(post.videoUrl)"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>

          <!-- Cover image (blog) -->
          <div v-else-if="post.coverImageUrl" class="mb-8 rounded-2xl overflow-hidden shadow-md">
            <img :src="post.coverImageUrl" class="w-full max-h-[420px] object-cover" />
          </div>

          <!-- Excerpt (if no content) -->
          <p v-if="post.excerpt && !post.content"
            class="text-lg text-surface-600 leading-relaxed mb-8 font-medium border-l-4 border-primary-400 pl-5">
            {{ post.excerpt }}
          </p>

          <!-- Article content -->
          <div class="prose prose-surface max-w-none">
            <p v-for="(para, i) in paragraphs" :key="i"
              class="text-surface-700 leading-relaxed mb-5 text-base">
              {{ para }}
            </p>
          </div>

          <!-- ── Prev / Next ───────────────────────────────────────────── -->
          <div class="flex items-start justify-between gap-6 mt-12 pt-8 border-t border-surface-200">
            <RouterLink v-if="prevPost"
              :to="{ name: 'blog-detail', params: { slug: prevPost.slug } }"
              class="flex-1 group">
              <p class="text-xs text-surface-400 mb-1">Previous Post</p>
              <p class="font-semibold text-surface-800 group-hover:text-primary-600 transition-colors line-clamp-2">
                {{ prevPost.title }}
              </p>
            </RouterLink>
            <RouterLink v-if="nextPost"
              :to="{ name: 'blog-detail', params: { slug: nextPost.slug } }"
              class="flex-1 text-right group">
              <p class="text-xs text-surface-400 mb-1">Next Post</p>
              <p class="font-semibold text-surface-800 group-hover:text-primary-600 transition-colors line-clamp-2">
                {{ nextPost.title }}
              </p>
            </RouterLink>
          </div>

        </div>
      </section>

      <!-- ── Similar Posts ──────────────────────────────────────────────── -->
      <section v-if="similar.length > 0" class="section bg-surface-50">
        <div class="container-app">
          <h2 class="text-xl font-bold text-surface-900 mb-6">Similar Posts</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <RouterLink
              v-for="p in similar" :key="p.id"
              :to="{ name: 'blog-detail', params: { slug: p.slug } }"
              class="card overflow-hidden hover:shadow-card-lg hover:-translate-y-1 transition-all duration-200 group"
            >
              <div class="h-36 bg-surface-100 overflow-hidden relative">
                <img v-if="p.coverImageUrl" :src="p.coverImageUrl"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div v-else class="w-full h-full flex items-center justify-center text-4xl text-surface-300">
                  {{ p.type === 'vlog' ? '▶' : '📄' }}
                </div>
                <span class="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                  :class="p.type === 'vlog' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'">
                  {{ p.type === 'vlog' ? 'Vlog' : 'Blog' }}
                </span>
              </div>
              <div class="p-4">
                <h3 class="font-bold text-surface-900 line-clamp-2 text-sm">{{ p.title }}</h3>
                <p class="text-xs text-surface-400 mt-1">{{ formatDate(p.publishedAt) }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
