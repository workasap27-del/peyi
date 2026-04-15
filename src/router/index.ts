import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ── Page principale : carte heatmap ──────────────────────────────────────
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },

    // ── Stories : expérience sondage plein écran ─────────────────────────────
    {
      path: '/participer/:id',
      name: 'survey-story',
      component: () => import('@/views/surveys/SurveyStoryView.vue'),
      props: true,
    },

    // ── Sondages (secondaire) ────────────────────────────────────────────────
    {
      path: '/sondages',
      name: 'surveys-list',
      component: () => import('@/views/surveys/SurveysListView.vue'),
    },
    {
      path: '/sondages/:id',
      name: 'survey-detail',
      component: () => import('@/views/surveys/SurveyDetailView.vue'),
      props: true,
    },

    // ── Actualités (secondaire) ──────────────────────────────────────────────
    {
      path: '/actualites',
      name: 'news-list',
      component: () => import('@/views/news/NewsListView.vue'),
    },
    {
      path: '/actualites/:slug',
      name: 'news-detail',
      component: () => import('@/views/news/NewsDetailView.vue'),
      props: true,
    },

    // ── Pages informatives ───────────────────────────────────────────────────
    {
      path: '/comment-ca-marche',
      name: 'how-it-works',
      component: () => import('@/views/HowItWorks.vue'),
    },
    {
      path: '/mentions-legales',
      name: 'legal-notice',
      component: () => import('@/views/LegalNotice.vue'),
    },

    // ── Admin (protégé par ?token=ADMIN_TOKEN) ───────────────────────────────
    {
      path: '/admin/questions',
      name: 'admin-questions',
      component: () => import('@/views/admin/AdminQuestionsView.vue'),
    },

    // ── 404 ──────────────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

export default router
