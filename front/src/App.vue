<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 用 computed，切換路由時會即時更新 layout
const layout = computed(() => route.meta.layout || 'default')

// 判斷是否已登入（用 store 或 localStorage 皆可）
const isAuthed = computed(() => !!userStore.token || !!localStorage.getItem('token'))

const goDashboard = () => {
  router.push({ name: 'app.dashboard' })
}

const handleLogout = () => {
  // 清掉登入資訊
  userStore.logout?.()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push({ name: 'auth.login' })
}
</script>

<template>
  <v-app>
    <!-- 全站共用 AppBar：可依需求顯示/隱藏 -->
    <v-app-bar v-if="layout !== 'auth'" color="surface" elevation="2" density="comfortable">
      <v-app-bar-title class="appbar-title clickable" @click="goDashboard">
        好鄰聚<span class="text-medium-emphasis">hood-link</span>
      </v-app-bar-title>
      <template #append>
        <!-- 放導覽、使用者選單等 -->
        <v-btn
          v-if="isAuthed"
          size="small"
          variant="text"
          prepend-icon="mdi-logout"
          @click="handleLogout"
        >
          登出
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <!-- 依 layout 切換 -->
      <DefaultLayout v-if="layout === 'default'">
        <RouterView />
      </DefaultLayout>

      <AuthLayout v-else-if="layout === 'auth'">
        <RouterView />
      </AuthLayout>
    </v-main>

    <!-- 可選：全站共用 Footer（登入註冊頁多半不顯示） -->
    <v-footer v-if="layout !== 'auth'" app color="transparent" class="text-medium-emphasis">
      <div class="mx-auto text-caption py-4">© {{ new Date().getFullYear() }} 好鄰聚</div>
    </v-footer>
  </v-app>
</template>

<script>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
export default { components: { DefaultLayout, AuthLayout } }
</script>

<style>
/* 全域：更好的可讀性 */
html,
body,
#app {
  height: 100%;
}
.clickable {
  cursor: pointer;
  user-select: none;
}
.appbar-title:hover {
  opacity: 0.85;
}
</style>
