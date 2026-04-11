// ─── Vue Router ───────────────────────────────────────────────────────────────
// All routes are defined here. Pages are lazy-loaded (imported dynamically)
// so the browser only downloads code when the user navigates to that page —
// this keeps the initial load fast.

import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards }                    from './guards'

const router = createRouter({
  // Use HTML5 history mode (clean URLs without #)
  history: createWebHistory(import.meta.env.BASE_URL),

  // Scroll to top on every navigation
  scrollBehavior: () => ({ top: 0 }),

  routes: [
    // ── Public routes (anyone can visit) ───────────────────────────────────
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../pages/public/HomePage.vue'),
        },
        {
          path: 'courses',
          name: 'courses',
          component: () => import('../pages/public/CoursesPage.vue'),
        },
        {
          path: 'courses/:slug',
          name: 'course-detail',
          component: () => import('../pages/public/CourseDetailPage.vue'),
        },
        {
          path: 'blog',
          name: 'blog',
          component: () => import('../pages/public/BlogListPage.vue'),
        },
        {
          path: 'blog/:slug',
          name: 'blog-detail',
          component: () => import('../pages/public/BlogDetailPage.vue'),
        },
      ],
    },

    // ── Auth routes (only for guests — redirects logged-in users) ──────────
    {
      path: '/',
      component: () => import('../layouts/AuthLayout.vue'),
      meta: { guestOnly: true },
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('../pages/auth/LoginPage.vue'),
        },
        {
          path: 'signup',
          name: 'signup',
          component: () => import('../pages/auth/SignupPage.vue'),
        },
      ],
    },

    // ── Student routes (requires login) ────────────────────────────────────
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../pages/student/DashboardPage.vue'),
        },
        {
          path: 'dashboard/courses/:courseId',
          name: 'my-course',
          component: () => import('../pages/student/MyCoursePage.vue'),
        },
        {
          path: 'learn/:courseId/lesson/:lessonId',
          name: 'lesson-viewer',
          component: () => import('../pages/student/LessonViewerPage.vue'),
          meta: { requiresEnrollment: true },
        },
        {
          path: 'payment/:courseId',
          name: 'payment',
          component: () => import('../pages/student/PaymentPage.vue'),
        },
        {
          path: 'payment/:courseId/status',
          name: 'payment-status',
          component: () => import('../pages/student/PaymentStatusPage.vue'),
        },
      ],
    },

    // ── Admin routes (requires admin role) ─────────────────────────────────
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',         // /admin → redirect to /admin/dashboard
          redirect: '/admin/dashboard',
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('../pages/admin/AdminDashboard.vue'),
        },
        {
          path: 'courses',
          name: 'admin-courses',
          component: () => import('../pages/admin/AdminCourses.vue'),
        },
        {
          path: 'courses/:id/edit',
          name: 'admin-course-edit',
          component: () => import('../pages/admin/AdminCourseEdit.vue'),
        },
        {
          path: 'courses/:id/lessons',
          name: 'admin-lessons',
          component: () => import('../pages/admin/AdminLessons.vue'),
        },
        {
          path: 'courses/:id/lessons/:lessonId/edit',
          name: 'admin-lesson-edit',
          component: () => import('../pages/admin/AdminLessonEdit.vue'),
        },
        {
          path: 'students',
          name: 'admin-students',
          component: () => import('../pages/admin/AdminStudents.vue'),
        },
        {
          path: 'enrollments',
          name: 'admin-enrollments',
          component: () => import('../pages/admin/AdminEnrollments.vue'),
        },
        {
          path: 'payments',
          name: 'admin-payments',
          component: () => import('../pages/admin/AdminPayments.vue'),
        },
        {
          path: 'testimonials',
          name: 'admin-testimonials',
          component: () => import('../pages/admin/AdminTestimonials.vue'),
        },
        {
          path: 'settings/banking',
          name: 'admin-banking',
          component: () => import('../pages/admin/AdminBankingSettings.vue'),
        },
        {
          path: 'blog',
          name: 'admin-blog',
          component: () => import('../pages/admin/AdminBlog.vue'),
        },
        {
          path: 'blog/new',
          name: 'admin-blog-new',
          component: () => import('../pages/admin/AdminBlogEdit.vue'),
        },
        {
          path: 'blog/:id/edit',
          name: 'admin-blog-edit',
          component: () => import('../pages/admin/AdminBlogEdit.vue'),
        },
      ],
    },

    // ── 404 fallback ────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/public/NotFoundPage.vue'),
    },
  ],
})

// Attach navigation guards (auth checking happens there)
setupGuards(router)

export default router
