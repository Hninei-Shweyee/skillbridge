<script setup>
// App.vue — Root component
// Renders the matched route's layout/page via RouterView.
// ToastContainer is mounted here so it's available on every page.
import { RouterView }    from 'vue-router'
import ToastContainer    from './components/ui/ToastContainer.vue'
</script>

<template>
  <RouterView />
  <!-- Global toast notifications — sits above all page content -->
  <ToastContainer />
</template>
