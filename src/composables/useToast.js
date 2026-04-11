// ─── useToast ─────────────────────────────────────────────────────────────────
// Global toast notification system.
// Usage in any component:
//   import { useToast } from '../composables/useToast'
//   const toast = useToast()
//   toast.success('Lesson saved!')
//   toast.error('Something went wrong.')
//   toast.info('Changes are being applied.')

import { ref } from 'vue'

// Shared reactive state — same instance across all components
const toasts = ref([])
let nextId = 0

function addToast(message, type = 'info', duration = 3500) {
  const id = ++nextId
  toasts.value.push({ id, message, type })

  // Auto-remove after duration
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    toasts,
    success: (msg, duration) => addToast(msg, 'success', duration),
    error:   (msg, duration) => addToast(msg, 'error',   duration ?? 5000),
    info:    (msg, duration) => addToast(msg, 'info',    duration),
    remove:  (id) => { toasts.value = toasts.value.filter(t => t.id !== id) },
  }
}
