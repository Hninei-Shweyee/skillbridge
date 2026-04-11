<script setup>
// ─── PdfList ──────────────────────────────────────────────────────────────────
// Day-specific PDF collection.
// Opens PDFs in a new tab (browser PDF viewer) and supports download.
// Props:
//   pdfs — [{ name: String, url: String }]

defineProps({
  pdfs: {
    type:    Array,
    default: () => [],
  },
})
</script>

<template>
  <div>
    <h3 class="font-bold text-surface-900 mb-3 flex items-center gap-2">
      <span class="text-lg">📚</span> Day PDFs
    </h3>

    <div v-if="pdfs.length === 0" class="text-sm text-surface-400">
      No PDFs for this lesson yet.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <a
        v-for="pdf in pdfs"
        :key="pdf.url"
        :href="pdf.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 transition-colors group"
      >
        <!-- PDF red icon -->
        <div class="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <span class="text-base">📄</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-surface-800 truncate group-hover:text-red-700 transition-colors">
            {{ pdf.name }}
          </p>
          <p class="text-xs text-red-400 font-medium">PDF</p>
        </div>
        <svg class="w-4 h-4 text-red-300 group-hover:text-red-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    </div>
  </div>
</template>
