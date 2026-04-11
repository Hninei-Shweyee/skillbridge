<script setup>
// ─── CourseCard ───────────────────────────────────────────────────────────────
// Reusable card for displaying a course in grids and featured sections.
// Props:
//   course — the Firestore course object
//   featured — if true, renders a larger horizontal card layout

defineProps({
  course: {
    type: Object,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <!-- ── Regular card (used in grids) ─────────────────────────────────────── -->
  <RouterLink
    v-if="!featured"
    :to="`/courses/${course.slug}`"
    class="card group flex flex-col overflow-hidden hover:shadow-card-lg hover:-translate-y-1 transition-all duration-200"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-video bg-gradient-to-br from-primary-900 to-accent-900 overflow-hidden">
      <img
        v-if="course.thumbnail"
        :src="course.thumbnail"
        :alt="course.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <!-- Fallback gradient with emoji -->
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="text-5xl">🎓</span>
      </div>

      <!-- Published badge -->
      <span class="absolute top-3 left-3 badge bg-primary-600 text-white">
        New
      </span>
    </div>

    <!-- Card body -->
    <div class="p-5 flex flex-col flex-1">
      <!-- Instructor -->
      <p class="text-xs font-medium text-primary-600 mb-1 uppercase tracking-wide">
        {{ course.instructor ?? 'SkillBridge' }}
      </p>

      <!-- Title -->
      <h3 class="font-bold text-surface-900 text-base leading-snug mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
        {{ course.title }}
      </h3>

      <!-- Description -->
      <p class="text-sm text-surface-500 line-clamp-2 flex-1">
        {{ course.description }}
      </p>

      <!-- Footer: lessons count + price -->
      <div class="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
        <span class="text-xs text-surface-400 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
          </svg>
          {{ course.totalLessons ?? '—' }} lessons
        </span>
        <span class="font-bold text-surface-900 text-sm">
          {{ course.price === 0 ? 'Free' : `${course.currency ?? 'MMK'} ${(course.price ?? 0).toLocaleString()}` }}
        </span>
      </div>
    </div>
  </RouterLink>

  <!-- ── Featured card (horizontal, used on homepage) ────────────────────── -->
  <RouterLink
    v-else
    :to="`/courses/${course.slug}`"
    class="card group flex flex-col md:flex-row overflow-hidden hover:shadow-card-lg transition-all duration-200"
  >
    <!-- Thumbnail -->
    <div class="relative md:w-2/5 aspect-video md:aspect-auto bg-gradient-to-br from-primary-900 to-accent-900 shrink-0 overflow-hidden">
      <img
        v-if="course.thumbnail"
        :src="course.thumbnail"
        :alt="course.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="text-7xl">🎓</span>
      </div>
      <span class="absolute top-4 left-4 badge bg-accent-500 text-white text-xs px-3 py-1">
        🔥 Featured Course
      </span>
    </div>

    <!-- Card body -->
    <div class="p-8 flex flex-col justify-center flex-1">
      <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">
        {{ course.instructor ?? 'SkillBridge' }}
      </p>
      <h3 class="text-2xl font-bold text-surface-900 leading-snug mb-3 group-hover:text-primary-700 transition-colors">
        {{ course.title }}
      </h3>
      <p class="text-surface-500 mb-6 leading-relaxed">
        {{ course.description }}
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <span class="btn-primary">
          View Course →
        </span>
        <span class="text-sm text-surface-500 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2V8z"/>
          </svg>
          {{ course.totalLessons ?? '—' }} lessons
        </span>
        <span class="font-bold text-surface-900">
          {{ course.price === 0 ? 'Free' : `${course.currency ?? 'MMK'} ${(course.price ?? 0).toLocaleString()}` }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
