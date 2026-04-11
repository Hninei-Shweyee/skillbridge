<script setup>
// ─── LearningTools ────────────────────────────────────────────────────────────
// A curated set of learning tools / apps recommended for the lesson.
// Displayed as clickable cards with a tool name, short description, and link.
// Props:
//   tools — [{ name: String, desc: String, url: String, icon: String }]
//   If no tools passed, shows the default SkillBridge recommended tools.

const props = defineProps({
  tools: {
    type:    Array,
    default: null,
  },
})

// Default tools shown when none are specified in the lesson data
const defaultTools = [
  {
    name: 'Google Veo3',
    desc: 'AI video generation tool used in this course',
    url:  'https://deepmind.google/technologies/veo/',
    icon: '🎬',
  },
  {
    name: 'Canva',
    desc: 'Design thumbnails and social content easily',
    url:  'https://canva.com',
    icon: '🎨',
  },
  {
    name: 'Notion',
    desc: 'Take notes and organise your learning',
    url:  'https://notion.so',
    icon: '📓',
  },
  {
    name: 'ChatGPT',
    desc: 'Use AI to brainstorm scripts and ideas',
    url:  'https://chat.openai.com',
    icon: '🤖',
  },
]

const displayTools = props.tools ?? defaultTools
</script>

<template>
  <div>
    <h3 class="font-bold text-surface-900 mb-3 flex items-center gap-2">
      <span class="text-lg">🛠️</span> Learning Tools
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <a
        v-for="tool in displayTools"
        :key="tool.name"
        :href="tool.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-start gap-3 p-4 rounded-xl border border-surface-200 bg-white hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-card transition-all group"
      >
        <div class="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-xl shrink-0 group-hover:bg-primary-100 transition-colors">
          {{ tool.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-surface-900 text-sm group-hover:text-primary-700 transition-colors">
            {{ tool.name }}
          </p>
          <p class="text-xs text-surface-500 mt-0.5 leading-snug">{{ tool.desc }}</p>
        </div>
      </a>
    </div>
  </div>
</template>
