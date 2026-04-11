<script setup>
// ─── TheFooter ────────────────────────────────────────────────────────────────
// Site-wide footer used on all public and student pages.
// Includes brand tagline, quick links, and copyright.
</script>

<template>
  <footer class="bg-surface-900 text-surface-400">
    <div class="container-app py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">

        <!-- ── Brand Column ─────────────────────────────────────────────── -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
              <span class="text-white font-bold text-sm">SB</span>
            </div>
            <span class="font-bold text-lg text-white tracking-tight">
              Skill<span class="text-primary-400">Bridge</span>
            </span>
          </div>
          <p class="text-sm leading-relaxed text-surface-400 max-w-xs">
            Practical AI skills for Myanmar learners. Learn, apply, and grow with
            real-world focused courses.
          </p>
        </div>

        <!-- ── Quick Links ────────────────────────────────────────────────── -->
        <div class="space-y-4">
          <h3 class="font-semibold text-white text-sm">Platform</h3>
          <ul class="space-y-2 text-sm">
            <li><a href="/courses" class="hover:text-white transition-colors">All Courses</a></li>
            <li><a href="/login"   class="hover:text-white transition-colors">Sign In</a></li>
            <li><a href="/signup"  class="hover:text-white transition-colors">Get Started</a></li>
          </ul>
        </div>

        <!-- ── Support Links ─────────────────────────────────────────────── -->
        <div class="space-y-4">
          <h3 class="font-semibold text-white text-sm">Support</h3>
          <ul class="space-y-2 text-sm">
            <!-- Replace with your real links in later phases -->
            <li><span class="cursor-default">Contact Us</span></li>
            <li><span class="cursor-default">FAQ</span></li>
            <li><span class="cursor-default">Community</span></li>
          </ul>
        </div>
      </div>

      <!-- ── Bottom bar ─────────────────────────────────────────────────── -->
      <div class="mt-10 pt-6 border-t border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-xs text-surface-500">
          © {{ new Date().getFullYear() }} SkillBridge. All rights reserved.
        </p>
        <p class="text-xs text-surface-600">
          Built for Myanmar learners 🇲🇲
        </p>
      </div>
    </div>
  </footer>
</template>
