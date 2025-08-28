// router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CommunityDashboardView from '@/views/CommunityDashboard.vue'
import AnnouncementView from '@/views/AnnouncementView.vue'
import EventView from '@/views/EventView.vue'
import CommunityJoinView from '@/views/CommunityJoin.vue'
import PostListView from '@/views/PostListView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import PostCreateView from '@/views/PostCreateView.vue'
import ReportCreateView from '@/views/reports/ReportCreateView.vue'
import ReportDetailView from '@/views/reports/ReportDetailView.vue'
import MeView from '@/views/me/MeView.vue'
import AdminCommunityDashboard from '@/views/admin/AdminCommunityDashboard.vue'
import AdminAnnouncement from '@/views/admin/AdminAnnouncement.vue'
import AdminEvent from '@/views/admin/AdminEvent.vue'
import AdminReport from '@/views/admin/AdminReport.vue'
import AdminReportDetail from '@/views/admin/AdminReportDetail.vue'
import AdminMembers from '@/views/admin/AdminMembers.vue'
import AdminCommunitySetting from '@/views/admin/AdminCommunitySetting.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    // 切頁預設回頂（避免從內頁返回時停在中間）
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      redirect: () => {
        const token = localStorage.getItem('token')
        return token ? { name: 'app.dashboard' } : { name: 'auth.login' }
      },
      meta: { layout: 'default' },
    },

    // ===== 公開頁（不需登入）=====
    { path: '/login', name: 'auth.login', component: LoginView, meta: { layout: 'auth' } },
    { path: '/register', name: 'auth.register', component: RegisterView, meta: { layout: 'auth' } },

    // ===== 使用者登入後首頁（非社區情境）=====
    {
      path: '/dashboard',
      name: 'app.dashboard',
      component: DashboardView,
      meta: { layout: 'default' },
    },

    // ===== 加入/尋找社區 =====
    {
      path: '/community/join',
      name: 'community.join',
      component: CommunityJoinView,
      meta: { layout: 'default' },
    },

    // ===== 社區情境頁（統一參數名 communityId）=====
    {
      path: '/community/:communityId',
      name: 'community.dashboard',
      component: CommunityDashboardView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/announcement',
      name: 'community.announcements',
      component: AnnouncementView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/events',
      name: 'community.events',
      component: EventView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/posts',
      name: 'community.posts',
      component: PostListView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/posts/create',
      name: 'post.create',
      component: PostCreateView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/posts/:postId',
      name: 'post.detail',
      component: PostDetailView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/reports/create',
      name: 'reports.create',
      component: ReportCreateView,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/community/:communityId/reports/:reportId',
      name: 'reports.detail',
      component: ReportDetailView,
      props: true,
      meta: { layout: 'default' },
    },

    // 個人頁面
    {
      path: '/me',
      name: 'me',
      component: MeView,
      props: true,
      meta: { layout: 'default' },
    },

    // ===== 管理員頁面 =====
    {
      path: '/admin/community/:communityId',
      name: 'admin.community.dashboard',
      component: AdminCommunityDashboard,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/admin/community/:communityId/announcement',
      name: 'admin.community.announcement',
      component: AdminAnnouncement,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/admin/community/:communityId/event',
      name: 'admin.community.event',
      component: AdminEvent,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/admin/community/:communityId/report',
      name: 'admin.community.report',
      component: AdminReport,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/admin/community/:communityId/report/:reportId',
      name: 'admin.community.report.detail',
      component: AdminReportDetail,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/admin/community/:communityId/members',
      name: 'admin.community.members',
      component: AdminMembers,
      props: true,
      meta: { layout: 'default' },
    },
    {
      path: '/admin/community/:communityId/settings',
      name: 'admin.community.settings',
      component: AdminCommunitySetting,
      props: true,
      meta: { layout: 'default' },
    },

    // （可選）404
    // { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue'), meta: { layout: 'default' } },
  ],
})

// ✅ 全域路由守衛：保護登入後的頁面
router.beforeEach((to, from, next) => {
  // 這些頁面不需登入
  const publicNames = new Set(['auth.login', 'auth.register'])
  const isPublic = publicNames.has(to.name)
  const token = localStorage.getItem('token')

  if (!isPublic && !token) {
    next({ name: 'auth.login' })
  } else {
    next()
  }
})

export default router
