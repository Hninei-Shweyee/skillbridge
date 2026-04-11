<script setup>
// ─── DefaultLayout ────────────────────────────────────────────────────────────
// Used by: all public pages and logged-in student pages.
// Structure: Navbar → page content → Footer
import TheNavbar from '../components/layout/TheNavbar.vue'
import TheFooter from '../components/layout/TheFooter.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <TheNavbar />

    <!-- Main content grows to fill remaining space -->
    <main class="flex-1">
      <RouterView />
    </main>

    <TheFooter />
  </div>
</template>
