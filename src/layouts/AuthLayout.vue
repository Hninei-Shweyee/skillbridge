<script setup>
// ─── AuthLayout ───────────────────────────────────────────────────────────────
// Used by: /login and /signup pages.
// Clean, centered layout — no navbar, no footer.
// Shows the SkillBridge logo at the top of the card.
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 flex flex-col items-center justify-center px-4 py-12">

    <!-- Logo above card -->
    <RouterLink to="/" class="flex items-center gap-2 mb-8">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
        <span class="text-white font-bold text-sm">SB</span>
      </div>
      <span class="font-bold text-xl text-white tracking-tight">
        Skill<span class="text-primary-400">Bridge</span>
      </span>
    </RouterLink>

    <!-- Auth form card -->
    <div class="w-full max-w-md card p-8 shadow-card-lg">
      <RouterView />
    </div>

    <!-- Back to home link -->
    <RouterLink to="/" class="mt-6 text-sm text-surface-400 hover:text-white transition-colors">
      ← Back to home
    </RouterLink>
  </div>
</template>
