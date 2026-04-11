// ─── App Entry Point ──────────────────────────────────────────────────────────
// Boot order:
//  1. Create Vue app
//  2. Install Pinia (must be before any store is used)
//  3. Start Firebase Auth listener (must be before router guards run)
//  4. Install Vue Router
//  5. Mount the app

import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import App              from './App.vue'
import router           from './router'
import { useAuthStore } from './stores/authStore'

// Global styles — Tailwind + SkillBridge brand tokens
import './assets/main.css'

const app   = createApp(App)
const pinia = createPinia()

// Pinia must be installed before any store is accessed
app.use(pinia)

// Start the Firebase Auth listener so route guards can read auth state immediately
const authStore = useAuthStore()
authStore.init()

app.use(router)
app.mount('#app')
