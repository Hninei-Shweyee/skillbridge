<script setup>
// ─── ToastContainer ───────────────────────────────────────────────────────────
// Renders all active toasts in the top-right corner.
// Place this once in App.vue — it reads from the shared useToast state.

import { useToast } from '../../composables/useToast'
const toast = useToast()
</script>

<template>
  <!-- Fixed top-right stack, above everything (z-50) -->
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
    <transition-group
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-8"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-8"
    >
      <div
        v-for="t in toast.toasts.value"
        :key="t.id"
        class="flex items-start gap-3 p-4 rounded-xl shadow-card-lg border text-sm font-medium"
        :class="{
          'bg-white border-success-200 text-success-800': t.type === 'success',
          'bg-white border-red-200    text-red-800':      t.type === 'error',
          'bg-white border-primary-200 text-primary-800': t.type === 'info',
        }"
      >
        <!-- Icon -->
        <span class="text-base shrink-0 mt-0.5">
          <svg v-if="t.type === 'success'" class="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="t.type === 'error'" class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <svg v-else class="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
        </span>

        <!-- Message -->
        <span class="flex-1">{{ t.message }}</span>

        <!-- Dismiss button -->
        <button @click="toast.remove(t.id)" class="text-surface-400 hover:text-surface-600 transition-colors shrink-0 ml-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>
