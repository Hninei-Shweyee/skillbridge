<script setup>
// ─── QASection ────────────────────────────────────────────────────────────────
// Q&A section for a lesson.
// Currently a static section with a link to submit questions.
// Phase 6+ can extend this with Firestore comments if needed.
// Props:
//   lessonId  — used to build a unique form URL or deep link
//   qaEnabled — boolean, if false shows a disabled state

defineProps({
  lessonId:  { type: String,  default: '' },
  qaEnabled: { type: Boolean, default: true },
  // Optional: a direct Q&A form URL (e.g. Google Form, Typeform)
  qaUrl: { type: String, default: '' },
})
</script>

<template>
  <div>
    <h3 class="font-bold text-surface-900 mb-3 flex items-center gap-2">
      <span class="text-lg">💬</span> Q&A
    </h3>

    <div v-if="!qaEnabled" class="card p-5 text-center text-sm text-surface-400">
      Q&A is not enabled for this lesson.
    </div>

    <div v-else class="card p-6 space-y-4">
      <p class="text-sm text-surface-600 leading-relaxed">
        Have a question about this lesson? Submit it below and the instructor will answer in the community or in the next live session.
      </p>

      <div class="flex flex-col sm:flex-row gap-3">
        <!-- If a direct Q&A URL is provided, open it -->
        <a
          v-if="qaUrl"
          :href="qaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-primary text-sm"
        >
          Ask a Question →
        </a>

        <!-- Default: show a mailto or placeholder -->
        <a
          v-else
          href="mailto:hello@skillbridge.mm?subject=Question about this lesson"
          class="btn-primary text-sm"
        >
          Submit a Question →
        </a>

        <p class="text-xs text-surface-400 self-center">
          Or ask in the community group below.
        </p>
      </div>
    </div>
  </div>
</template>
