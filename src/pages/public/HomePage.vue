<script setup>
// ─── HomePage ─────────────────────────────────────────────────────────────────
// The public marketing landing page.
// Sections:
//  1. Hero — bold headline, CTA buttons, trust stats
//  2. Featured Course — the Veo3 AI Class card
//  3. Why Learn With Us — 4 benefit cards
//  4. How It Works — 3-step process
//  5. CTA Banner — bottom sign-up push

import { onMounted, ref }    from 'vue'
import { useCourseStore }    from '../../stores/courseStore'
import { useTestimonials }   from '../../composables/useTestimonials'
import { useBlog }           from '../../composables/useBlog'
import CourseCard            from '../../components/course/CourseCard.vue'
import AppSpinner            from '../../components/ui/AppSpinner.vue'

const courseStore = useCourseStore()
const { testimonials, fetchAllTestimonials } = useTestimonials()
const { posts: blogPosts, fetchPublishedPosts } = useBlog()

onMounted(() => {
  courseStore.fetchCourses()
  fetchAllTestimonials(null)
  fetchPublishedPosts()
})

function formatDate(ts) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function starArray(rating) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}

// Benefits data — edit copy here
const benefits = [
  {
    icon: '🎯',
    title: 'Real-World Focused',
    desc: 'Every lesson is built around actual work scenarios — not just theory. You learn by doing.',
  },
  {
    icon: '🇲🇲',
    title: 'Myanmar-Friendly',
    desc: 'Content designed with Myanmar learners in mind. Familiar context, practical examples.',
  },
  {
    icon: '📱',
    title: 'Learn Anywhere',
    desc: 'Access your lessons from any device — desktop, tablet, or mobile. At your own pace.',
  },
  {
    icon: '🚀',
    title: 'Industry-Ready Skills',
    desc: 'Graduate with skills employers and clients actually want in today\'s AI-powered market.',
  },
]

// How it works steps
const steps = [
  { number: '01', title: 'Sign Up Free',       desc: 'Create your account in 30 seconds. No credit card required.' },
  { number: '02', title: 'Enroll in a Course', desc: 'Pick the right course for your goals and get instant access.' },
  { number: '03', title: 'Learn & Grow',        desc: 'Watch lessons, complete exercises, and track your progress.' },
]
</script>

<template>
  <div>
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 1. HERO SECTION                                                      -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="relative overflow-hidden" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);">
      <!-- Animated glow orbs -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/25 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

      <div class="container-app relative z-10 py-24 lg:py-36">
        <div class="max-w-3xl mx-auto text-center animate-fade-in">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-primary-200 text-xs font-semibold mb-8 backdrop-blur-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></span>
            Now enrolling — Veo3 AI Class
          </div>

          <!-- Headline -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Master
            <span class="bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
              Real-World AI Skills
            </span>
            <br />for Modern Work
          </h1>

          <!-- Sub-headline -->
          <p class="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto">
            SkillBridge teaches you AI tools that actually matter for your job and business — practical, hands-on, and built for Myanmar learners.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap gap-4 justify-center">
            <RouterLink to="/signup" class="px-7 py-3 text-base rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold transition-colors shadow-lg">
              Get Started Free →
            </RouterLink>
            <RouterLink to="/courses" class="px-7 py-3 text-base rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
              Browse Courses
            </RouterLink>
          </div>

          <!-- Trust stats -->
          <div class="flex flex-wrap justify-center gap-10 mt-14 pt-10 border-t border-white/15">
            <div class="text-center">
              <div class="text-3xl font-extrabold text-white">100%</div>
              <div class="text-xs text-slate-400 mt-1 uppercase tracking-wide">Practical Content</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-extrabold text-white">Veo3</div>
              <div class="text-xs text-slate-400 mt-1 uppercase tracking-wide">AI Focused</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-extrabold text-white">🇲🇲</div>
              <div class="text-xs text-slate-400 mt-1 uppercase tracking-wide">Myanmar Made</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 2. FEATURED COURSE                                                   -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section bg-white">
      <div class="container-app">
        <div class="text-center mb-10">
          <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Available Now</p>
          <h2 class="section-title">Our First Course</h2>
        </div>

        <!-- Loading state -->
        <div v-if="courseStore.loading" class="flex justify-center py-12">
          <AppSpinner size="lg" />
        </div>

        <!-- Featured course card -->
        <div v-else-if="courseStore.courses.length > 0" class="animate-fade-in">
          <CourseCard :course="courseStore.courses[0]" :featured="true" />
        </div>

        <!-- Empty state (no courses in Firestore yet) -->
        <div v-else class="card p-12 text-center">
          <div class="text-5xl mb-4">🚧</div>
          <h3 class="font-semibold text-surface-700 mb-2">Course launching soon</h3>
          <p class="text-surface-400 text-sm">Check back shortly — we're adding the first course now.</p>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 3. WHY LEARN WITH US                                                 -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section" style="background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);">
      <div class="container-app">
        <div class="text-center mb-12">
          <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Our Difference</p>
          <h2 class="section-title">Why Learn With SkillBridge?</h2>
          <p class="text-surface-500 mt-3 max-w-xl mx-auto">
            We're not another tutorial site. Every course is designed around outcomes — skills you can use on day one.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="bg-white rounded-2xl p-6 shadow-sm border border-primary-100/60 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl mb-4">{{ benefit.icon }}</div>
            <h3 class="font-bold text-surface-900 mb-2">{{ benefit.title }}</h3>
            <p class="text-sm text-surface-500 leading-relaxed">{{ benefit.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 4. HOW IT WORKS                                                      -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section bg-white">
      <div class="container-app">
        <div class="text-center mb-12">
          <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Simple Process</p>
          <h2 class="section-title">How It Works</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            v-for="step in steps"
            :key="step.number"
            class="text-center"
          >
            <!-- Step number bubble -->
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span class="text-white font-extrabold text-lg">{{ step.number }}</span>
            </div>
            <h3 class="font-bold text-surface-900 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-surface-500 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 5. TESTIMONIALS                                                       -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section v-if="testimonials.length > 0" class="section bg-surface-50">
      <div class="container-app">
        <div class="text-center mb-12">
          <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Student Reviews</p>
          <h2 class="section-title">What Our Students Say</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="t in testimonials"
            :key="t.id"
            class="card p-6 flex flex-col gap-4"
          >
            <!-- Stars -->
            <div class="flex items-center gap-0.5">
              <svg
                v-for="(filled, i) in starArray(t.rating)"
                :key="i"
                class="w-4 h-4"
                :class="filled ? 'text-amber-400' : 'text-surface-200'"
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>

            <!-- Review text -->
            <p class="text-surface-600 text-sm leading-relaxed flex-1">"{{ t.content }}"</p>

            <!-- Student info -->
            <div class="flex items-center gap-3 pt-2 border-t border-surface-100">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                <img v-if="t.studentAvatar" :src="t.studentAvatar" class="w-full h-full object-cover" />
                <span v-else>{{ t.studentName?.charAt(0)?.toUpperCase() }}</span>
              </div>
              <span class="font-semibold text-surface-900 text-sm">{{ t.studentName }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 6. LATEST BLOG POSTS                                                  -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section v-if="blogPosts.length > 0" class="section bg-white">
      <div class="container-app">
        <div class="flex items-end justify-between mb-10">
          <div>
            <p class="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Latest Articles</p>
            <h2 class="section-title">From Our Blog</h2>
          </div>
          <RouterLink to="/blog" class="btn-ghost text-sm hidden sm:inline-flex">
            View All →
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RouterLink
            v-for="post in blogPosts.slice(0, 3)" :key="post.id"
            :to="{ name: 'blog-detail', params: { slug: post.slug } }"
            class="card flex flex-col overflow-hidden hover:shadow-card-lg hover:-translate-y-1 transition-all duration-200 group"
          >
            <!-- Cover image -->
            <div class="relative h-44 bg-surface-100 overflow-hidden shrink-0">
              <img v-if="post.coverImageUrl" :src="post.coverImageUrl"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-300 text-5xl">
                {{ post.type === 'vlog' ? '▶' : '📄' }}
              </div>
              <!-- Play overlay for vlogs -->
              <div v-if="post.type === 'vlog'"
                class="absolute inset-0 flex items-center justify-center bg-black/30">
                <div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                  <svg class="w-4 h-4 text-surface-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                  </svg>
                </div>
              </div>
              <!-- Category tags over image -->
              <div class="absolute bottom-0 left-0 right-0 px-3 py-2 flex flex-wrap gap-1 bg-gradient-to-t from-black/60 to-transparent">
                <span v-for="cat in (post.categories || []).slice(0, 3)" :key="cat"
                  class="text-xs text-white font-medium">
                  {{ cat }}<span v-if="(post.categories || []).indexOf(cat) < (post.categories || []).slice(0, 3).length - 1">,</span>
                </span>
              </div>
            </div>

            <!-- Card body -->
            <div class="p-5 flex flex-col flex-1">
              <h3 class="font-bold text-surface-900 leading-snug mb-3 line-clamp-2">{{ post.title }}</h3>

              <div class="flex items-center justify-between mt-auto pt-3 border-t border-surface-100">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                    <img v-if="post.authorAvatarUrl" :src="post.authorAvatarUrl" class="w-full h-full object-cover" />
                    <span v-else>{{ post.authorName?.charAt(0)?.toUpperCase() ?? 'S' }}</span>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-primary-600">{{ post.authorName }}</p>
                    <p class="text-xs text-surface-400">{{ formatDate(post.publishedAt) }}</p>
                  </div>
                </div>
                <span class="text-xs px-3 py-1.5 rounded-lg border border-surface-200 text-surface-600 font-medium group-hover:border-primary-400 group-hover:text-primary-700 transition-colors whitespace-nowrap">
                  {{ post.type === 'vlog' ? 'Watch Now' : 'Continue Reading' }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div class="text-center mt-8 sm:hidden">
          <RouterLink to="/blog" class="btn-secondary text-sm">View All Posts →</RouterLink>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- 7. BOTTOM CTA BANNER                                                 -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section bg-gradient-to-br from-primary-600 to-accent-600">
      <div class="container-app text-center">
        <h2 class="text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">
          Ready to build real skills?
        </h2>
        <p class="text-primary-200 text-lg mb-8 max-w-xl mx-auto">
          Join SkillBridge today and start learning AI tools that work in the real world.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <RouterLink to="/signup" class="px-8 py-3 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-colors shadow-lg">
            Create Free Account →
          </RouterLink>
          <RouterLink to="/courses" class="px-8 py-3 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-colors">
            Browse Courses
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
