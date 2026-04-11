<script setup>
// ─── CommunityLinks ───────────────────────────────────────────────────────────
// Social community links for a lesson (Telegram, Facebook Group, Discord, etc.)
// Props:
//   links — [{ label: String, url: String, icon: String }]
//   icon values: 'telegram' | 'facebook' | 'discord' | 'whatsapp' | 'youtube' | 'link'

defineProps({
  links: {
    type:    Array,
    default: () => [],
  },
})

// Returns a brand colour class for the platform icon background
function platformColor(icon = '') {
  const map = {
    telegram:  'bg-sky-500',
    facebook:  'bg-blue-600',
    discord:   'bg-indigo-500',
    whatsapp:  'bg-green-500',
    youtube:   'bg-red-600',
    link:      'bg-surface-600',
  }
  return map[icon.toLowerCase()] ?? 'bg-surface-600'
}

// Simple emoji icon fallback map
function platformEmoji(icon = '') {
  const map = {
    telegram:  '✈️',
    facebook:  '📘',
    discord:   '🎮',
    whatsapp:  '💬',
    youtube:   '▶️',
    link:      '🔗',
  }
  return map[icon.toLowerCase()] ?? '🔗'
}
</script>

<template>
  <div>
    <h3 class="font-bold text-surface-900 mb-3 flex items-center gap-2">
      <span class="text-lg">🌐</span> Community
    </h3>

    <div v-if="links.length === 0" class="text-sm text-surface-400">
      No community links added yet.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <a
        v-for="link in links"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-4 rounded-xl border border-surface-200 bg-white hover:shadow-card hover:-translate-y-0.5 transition-all group"
      >
        <!-- Platform icon circle -->
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base shrink-0"
          :class="platformColor(link.icon)"
        >
          {{ platformEmoji(link.icon) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-surface-900 text-sm truncate group-hover:text-primary-700 transition-colors">
            {{ link.label }}
          </p>
          <p class="text-xs text-surface-400 capitalize">{{ link.icon || 'link' }}</p>
        </div>
        <svg class="w-4 h-4 text-surface-300 group-hover:text-primary-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    </div>
  </div>
</template>
