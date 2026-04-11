<script setup>
// ─── ExtraVideos ──────────────────────────────────────────────────────────────
// Short extra resource videos (Video-1, Video-2, Video-3 — each 3–5 min).
// Each video opens as an inline embed when clicked (accordion style).
// Props:
//   videos — [{ title: String, url: String, type: 'youtube'|'vimeo', duration: Number }]

import { ref, computed } from 'vue'
import VideoPlayer from './VideoPlayer.vue'

defineProps({
  videos: {
    type:    Array,
    default: () => [],
  },
})

// Track which video is currently expanded
const openIndex = ref(null)

function toggle(index) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <div>
    <h3 class="font-bold text-surface-900 mb-3 flex items-center gap-2">
      <span class="text-lg">🎥</span> Extra Resource Videos
    </h3>

    <div v-if="videos.length === 0" class="text-sm text-surface-400">
      No extra videos for this lesson yet.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(video, index) in videos"
        :key="index"
        class="rounded-xl border border-surface-200 overflow-hidden"
      >
        <!-- Accordion header — click to expand/collapse -->
        <button
          @click="toggle(index)"
          class="w-full flex items-center gap-3 p-4 bg-white hover:bg-surface-50 transition-colors text-left"
        >
          <!-- Play / collapse icon -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="openIndex === index ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'"
          >
            <svg v-if="openIndex !== index" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium text-surface-900 text-sm">
              Video {{ index + 1 }}: {{ video.title }}
            </p>
            <p v-if="video.duration" class="text-xs text-surface-400 mt-0.5">
              {{ video.duration }} min
            </p>
          </div>

          <!-- Provider badge -->
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
            :class="video.type === 'youtube'
              ? 'bg-red-100 text-red-600'
              : 'bg-sky-100 text-sky-600'"
          >
            {{ video.type === 'youtube' ? 'YouTube' : 'Vimeo' }}
          </span>
        </button>

        <!-- Expanded video embed -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-screen"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 max-h-screen"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="openIndex === index" class="p-3 bg-surface-50 border-t border-surface-200">
            <VideoPlayer :video="video" />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
