<script setup>
// ─── BlogListPage ─────────────────────────────────────────────────────────────
// Public blog/vlog listing with category filter.

import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink }                      from 'vue-router'
import { useBlog }                         from '../../composables/useBlog'
import AppSpinner                          from '../../components/ui/AppSpinner.vue'

const { posts, loading, fetchPublishedPosts } = useBlog()

const activeCategory = ref('All')
const allPosts       = ref([])  // holds the full unfiltered list

// Derive unique categories from actual published posts
const allCategories = computed(() => {
  const cats = new Set()
  allPosts.value.forEach(p => (p.categories || []).forEach(c => cats.add(c)))
  return ['All', ...Array.from(cats).sort()]
})

// Filtered list based on selected category
const filteredPosts = computed(() => {
  if (activeCategory.value === 'All') return allPosts.value
  return allPosts.value.filter(p => (p.categories || []).includes(activeCategory.value))
})

onMounted(async () => {
  await fetchPublishedPosts()
  allPosts.value = posts.value
})

function formatDate(ts) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <!-- Header -->
    <section class="bg-surface-900 py-16">
      <div class="container-app text-center">
        <p class="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">Articles & Videos</p>
        <h1 class="text-4xl font-extrabold text-white mb-4">Blog & Vlogs</h1>
        <p class="text-surface-300 text-lg max-w-xl mx-auto">
          Insights, tutorials, and IT knowledge to help you grow your skills and career.
        </p>
      </div>
    </section>

    <section class="section bg-surface-50">
      <div class="container-app">

        <!-- Category filter (only shown when there are posts with categories) -->
        <div v-if="allCategories.length > 1" class="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            v-for="cat in allCategories" :key="cat"
            @click="activeCategory = cat"
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            :class="activeCategory === cat
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-400 hover:text-primary-700'"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-16"><AppSpinner size="lg" /></div>

        <!-- Empty -->
        <div v-else-if="filteredPosts.length === 0" class="card p-16 text-center">
          <p class="text-4xl mb-3">📝</p>
          <p class="font-semibold text-surface-700">No posts yet in this category.</p>
          <p class="text-surface-400 text-sm mt-1">Check back soon!</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          <RouterLink
            v-for="post in filteredPosts" :key="post.id"
            :to="{ name: 'blog-detail', params: { slug: post.slug } }"
            class="card flex flex-col overflow-hidden hover:shadow-card-lg hover:-translate-y-1 transition-all duration-200 group"
          >
            <!-- Cover image / thumbnail -->
            <div class="relative h-44 bg-surface-100 overflow-hidden shrink-0">
              <img v-if="post.coverImageUrl" :src="post.coverImageUrl"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-300 text-5xl">
                {{ post.type === 'vlog' ? '▶' : '📄' }}
              </div>
              <!-- Play overlay for vlogs -->
              <div v-if="post.type === 'vlog'"
                class="absolute inset-0 flex items-center justify-center bg-black/30">
                <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg class="w-5 h-5 text-surface-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                  </svg>
                </div>
              </div>
              <!-- Type badge -->
              <span class="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                :class="post.type === 'vlog' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'">
                {{ post.type === 'vlog' ? 'Vlog' : 'Blog' }}
              </span>
            </div>

            <!-- Card body -->
            <div class="p-5 flex flex-col flex-1">
              <!-- Categories -->
              <div class="flex flex-wrap gap-1 mb-3">
                <span v-for="cat in (post.categories || []).slice(0, 2)" :key="cat"
                  class="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                  {{ cat }}
                </span>
              </div>

              <!-- Title -->
              <h2 class="font-bold text-surface-900 leading-snug mb-2 line-clamp-2">{{ post.title }}</h2>

              <!-- Excerpt -->
              <p v-if="post.excerpt" class="text-sm text-surface-500 leading-relaxed line-clamp-2 flex-1">
                {{ post.excerpt }}
              </p>

              <!-- Footer -->
              <div class="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                    <img v-if="post.authorAvatarUrl" :src="post.authorAvatarUrl" class="w-full h-full object-cover" />
                    <span v-else>{{ post.authorName?.charAt(0)?.toUpperCase() ?? 'S' }}</span>
                  </div>
                  <span class="text-xs text-surface-500">{{ post.authorName }}</span>
                </div>
                <span class="text-xs text-surface-400">{{ formatDate(post.publishedAt) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

      </div>
    </section>
  </div>
</template>
