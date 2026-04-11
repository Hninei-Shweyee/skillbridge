<script setup>
// ─── AppSpinner ───────────────────────────────────────────────────────────────
// A simple animated loading spinner.
// Usage: <AppSpinner /> or <AppSpinner size="lg" />
// Sizes: sm (16px) | md (24px, default) | lg (40px)

defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})
</script>

<template>
  <svg
    :class="{
      'w-4 h-4': size === 'sm',
      'w-6 h-6': size === 'md',
      'w-10 h-10': size === 'lg',
    }"
    class="animate-spin text-primary-600"
    fill="none"
    viewBox="0 0 24 24"
    aria-label="Loading"
  >
    <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
    <path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
  </svg>
</template>
