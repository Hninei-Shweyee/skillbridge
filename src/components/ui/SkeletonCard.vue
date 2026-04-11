<script setup>
// ─── SkeletonCard ─────────────────────────────────────────────────────────────
// Animated placeholder shown while course data is loading.
// Mimics the shape of a CourseCard so the layout doesn't jump.
// Usage: <SkeletonCard /> or repeat with v-for for a grid.
</script>

<template>
  <div class="card overflow-hidden animate-pulse">
    <!-- Thumbnail placeholder -->
    <div class="aspect-video bg-surface-200" />

    <!-- Body placeholder -->
    <div class="p-5 space-y-3">
      <!-- Instructor line -->
      <div class="h-3 w-20 bg-surface-200 rounded-full" />
      <!-- Title lines -->
      <div class="h-4 w-3/4 bg-surface-200 rounded-full" />
      <div class="h-4 w-1/2 bg-surface-200 rounded-full" />
      <!-- Description -->
      <div class="space-y-1.5 pt-1">
        <div class="h-3 bg-surface-100 rounded-full" />
        <div class="h-3 w-4/5 bg-surface-100 rounded-full" />
      </div>
      <!-- Footer -->
      <div class="flex justify-between pt-3 border-t border-surface-100">
        <div class="h-3 w-16 bg-surface-200 rounded-full" />
        <div class="h-3 w-12 bg-surface-200 rounded-full" />
      </div>
    </div>
  </div>
</template>
