<script setup>
// ─── CoursesPage ──────────────────────────────────────────────────────────────
// Public course catalog. Loads all published courses from Firestore.

import { onMounted }      from 'vue'
import { useCourseStore } from '../../stores/courseStore'
import CourseCard         from '../../components/course/CourseCard.vue'
import SkeletonCard       from '../../components/ui/SkeletonCard.vue'

const courseStore = useCourseStore()

onMounted(() => {
  courseStore.fetchCourses()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="bg-surface-900 py-14">
      <div class="container-app text-center">
        <p class="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">SkillBridge Courses</p>
        <h1 class="text-4xl font-extrabold text-white mb-3 tracking-tight">All Courses</h1>
        <p class="text-surface-400 max-w-lg mx-auto">
          Practical, real-world AI skills. Built for Myanmar learners. Updated regularly.
        </p>
      </div>
    </div>

    <!-- Course Grid -->
    <div class="section container-app">
      <!-- Skeleton loading state -->
      <div v-if="courseStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard v-for="n in 3" :key="n" />
      </div>

      <!-- Courses -->
      <div
        v-else-if="courseStore.courses.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
      >
        <CourseCard
          v-for="course in courseStore.courses"
          :key="course.id"
          :course="course"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div class="text-6xl mb-5">📚</div>
        <h2 class="text-xl font-bold text-surface-900 mb-2">No courses yet</h2>
        <p class="text-surface-500 text-sm max-w-xs">
          We're preparing our first course. Check back shortly!
        </p>
      </div>
    </div>
  </div>
</template>
