import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CommunityDashboardView from '@/views/CommunityDashboard.vue'
import AnnouncementView from '@/views/AnnouncementView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterView,
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
    },
    {
      path: '/community/:id',
      name: 'CommunityDashboard',
      component: CommunityDashboardView,
    },
    {
      path: '/community/:id/announcement',
      name: 'AnnouncementView',
      component: AnnouncementView,
    },
  ],
})
// ✅ 全域路由守衛：保護登入後的頁面
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token') // 假設 JWT 存在 localStorage

  const publicPages = ['login', 'Register']
  const isPublic = publicPages.includes(to.name)

  if (!isPublic && !token) {
    // 沒登入又想去私密頁，導去 login
    next({ name: 'login' })
  } else {
    // 通過
    next()
  }
})

export default router
