// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CommunityDashboardView from '@/views/CommunityDashboard.vue'
import AnnouncementView from '@/views/AnnouncementView.vue'
import EventView from '@/views/EventView.vue'
import CommunityJoinView from '@/views/CommunityJoin.vue'
import PostListView from '@/views/PostListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const token = localStorage.getItem('token')
        return token ? { name: 'app.dashboard' } : { name: 'auth.login' }
      },
    },

    // 公開頁
    { path: '/login', name: 'auth.login', component: LoginView },
    { path: '/register', name: 'auth.register', component: RegisterView },

    // 使用者登入後首頁（非社區情境）
    { path: '/dashboard', name: 'app.dashboard', component: DashboardView },

    // 加入/尋找社區
    {
      path: '/community/join',
      name: 'community.join',
      component: CommunityJoinView,
    },

    // 社區情境頁（統一參數名 communityId）
    {
      path: '/community/:communityId',
      name: 'community.dashboard',
      component: CommunityDashboardView,
    },
    {
      path: '/community/:communityId/announcement',
      name: 'community.announcements',
      component: AnnouncementView,
    },
    {
      path: '/community/:communityId/events',
      name: 'community.events',
      component: EventView,
    },
    {
      path: '/community/:communityId/posts',
      name: 'community.posts',
      component: PostListView,
    },
  ],
})

// ✅ 全域路由守衛：保護登入後的頁面
router.beforeEach((to, from, next) => {
  console.log(`🛤️ 導航：${from.fullPath} → ${to.fullPath}`)

  const token = localStorage.getItem('token')

  // 這些頁面不需登入
  const publicNames = new Set(['auth.login', 'auth.register'])
  const isPublic = publicNames.has(to.name)

  if (!isPublic && !token) {
    next({ name: 'auth.login' })
  } else {
    next()
  }
})

export default router
