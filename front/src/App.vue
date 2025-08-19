<!-- src/App.vue -->
<template>
  <v-app>
    <!-- 共用 AppBar（登入/註冊頁不顯示） -->
    <v-app-bar v-if="layout !== 'auth'" color="surface" elevation="2" density="comfortable">
      <v-app-bar-title class="appbar-title clickable" @click="goDashboard">
        好鄰聚<span class="text-medium-emphasis">hood-link</span>
      </v-app-bar-title>

      <template #append>
        <!-- 右側操作區 -->
        <template v-if="isAuthed">
          <!-- 使用者頭像／載入骨架 -->
          <v-btn icon :to="{ name: 'me' }" :disabled="loadingUser">
            <v-avatar size="32">
              <template v-if="!loadingUser">
                <v-img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="avatar" cover />
                <span v-else>{{ userInitial }}</span>
                <!-- <span v-else>{{ (user?.name || 'U').slice(0, 1).toUpperCase() }}</span> -->
              </template>
              <template v-else>
                <v-skeleton-loader type="avatar" width="32" height="32" />
              </template>
            </v-avatar>
          </v-btn>

          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-logout"
            class="ml-2"
            @click="handleLogout"
          >
            登出
          </v-btn>
        </template>

        <template v-else>
          <v-btn color="primary" size="small" variant="flat" :to="{ name: 'auth.login' }">
            登入
          </v-btn>
        </template>
      </template>
    </v-app-bar>

    <v-main>
      <DefaultLayout v-if="layout === 'default'">
        <RouterView />
      </DefaultLayout>

      <AuthLayout v-else-if="layout === 'auth'">
        <RouterView />
      </AuthLayout>
    </v-main>

    <v-footer v-if="layout !== 'auth'" app color="transparent" class="text-medium-emphasis">
      <div class="mx-auto text-caption py-4">© {{ new Date().getFullYear() }} 好鄰聚</div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import api from '@/services/api'

// 路由 & 版型
const route = useRoute()
const router = useRouter()
const layout = computed(() => route.meta.layout || 'default')

// 使用者/登入狀態
const userStore = useUserStore()
const { user, token } = storeToRefs(userStore) // ✅ 確保響應性
const isAuthed = computed(() => !!token.value || !!localStorage.getItem('token'))
const loadingUser = ref(false)

const userInitial = computed(() => {
  const n = (user.value?.name || user.value?.email || 'U').trim()
  return n ? n[0].toUpperCase() : 'U'
})
// 初始化嘗試抓取使用者（若未登入不報錯）
onMounted(async () => {
  if (!isAuthed.value) return
  loadingUser.value = true
  try {
    await userStore.ensureUser?.(api)
  } catch (_) {
    // token 失效等情形：視需要清除並導回登入
  } finally {
    loadingUser.value = false
  }
})

// 導航 & 登出
const goDashboard = () => router.push({ name: 'app.dashboard' })
const handleLogout = () => {
  userStore.logout?.()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push({ name: 'auth.login' })
}
</script>

<style>
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
