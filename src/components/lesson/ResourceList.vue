<script setup>
// ─── ResourceList ─────────────────────────────────────────────────────────────
// Displays downloadable resource files (zip, xlsx, pptx, etc.)
// Each item is a direct download link to Firebase Storage.
// Props:
//   files — [{ name: String, url: String, type: String }]

defineProps({
  files: {
    type:    Array,
    default: () => [],
  },
})

// Choose icon based on file extension / type
function fileIcon(type = '') {
  const t = type.toLowerCase()
  if (t.includes('pdf'))                            return '📄'
  if (t.includes('zip') || t.includes('rar'))       return '🗜️'
  if (t.includes('xls') || t.includes('sheet'))     return '📊'
  if (t.includes('ppt') || t.includes('present'))   return '📑'
  if (t.includes('doc') || t.includes('word'))      return '📝'
  if (t.includes('mp4') || t.includes('video'))     return '🎬'
  return '📎'
}
</script>

<template>
  <div>
    <h3 class="font-bold text-surface-900 mb-3 flex items-center gap-2">
      <span class="text-lg">📦</span> Resource Files
    </h3>

    <div v-if="files.length === 0" class="text-sm text-surface-400">
      No resource files for this lesson yet.
    </div>

    <div v-else class="space-y-2">
      <a
        v-for="file in files"
        :key="file.url"
        :href="file.url"
        target="_blank"
        rel="noopener noreferrer"
        download
        class="flex items-center gap-3 p-3 rounded-xl border border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 transition-colors group"
      >
        <span class="text-xl shrink-0">{{ fileIcon(file.type) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-surface-800 truncate group-hover:text-primary-700 transition-colors">
            {{ file.name }}
          </p>
          <p class="text-xs text-surface-400 uppercase">{{ file.type || 'file' }}</p>
        </div>
        <!-- Download arrow -->
        <svg class="w-4 h-4 text-surface-400 group-hover:text-primary-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      </a>
    </div>
  </div>
</template>
