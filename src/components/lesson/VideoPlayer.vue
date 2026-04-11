<script setup>
// ─── VideoPlayer ──────────────────────────────────────────────────────────────
// Embeds a YouTube or Vimeo video using a responsive 16:9 iframe.
// Props:
//   video — { type: 'youtube'|'vimeo', url: string }
//
// Supported URL formats:
//   YouTube: https://www.youtube.com/watch?v=ID  OR  https://youtu.be/ID
//   Vimeo:   https://vimeo.com/ID

import { computed } from 'vue'

const props = defineProps({
  video: {
    type:     Object,
    required: true,
    // expected shape: { type: 'youtube'|'vimeo', url: String }
  },
})

// Build the embeddable src URL from the raw video URL
const embedSrc = computed(() => {
  if (!props.video?.url) return null
  const url = props.video.url

  if (props.video.type === 'youtube') {
    // Extract video ID from multiple YouTube URL formats
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    )
    const id = match?.[1]
    if (!id) return null
    // enablejsapi=0 for privacy, rel=0 to prevent unrelated recommendations
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
  }

  if (props.video.type === 'vimeo') {
    // Extract numeric video ID from vimeo.com/ID or vimeo.com/channels/x/ID
    const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/)
    const id = match?.[1]
    if (!id) return null
    return `https://player.vimeo.com/video/${id}?byline=0&portrait=0&title=0`
  }

  return null
})
</script>

<template>
  <div class="w-full">
    <!-- Valid embed -->
    <div
      v-if="embedSrc"
      class="relative w-full rounded-2xl overflow-hidden bg-black shadow-card-lg"
      style="padding-top: 56.25%"
    >
      <!-- 56.25% = 16:9 aspect ratio trick -->
      <iframe
        :src="embedSrc"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
        title="Lesson video"
      />
    </div>

    <!-- Invalid / missing URL fallback -->
    <div
      v-else
      class="w-full rounded-2xl bg-surface-900 flex flex-col items-center justify-center py-20 gap-3"
    >
      <span class="text-4xl">🎬</span>
      <p class="text-surface-400 text-sm">Video not available yet.</p>
    </div>
  </div>
</template>
