<!-- src/App.vue -->
<template>
  <!-- 海報外框：樣式在 theme.css 的 .app-frame -->
  <div class="app-frame">
    <v-app>
      <!-- 共用 AppBar（登入/註冊頁不顯示） -->
      <v-app-bar
        v-if="layout !== 'auth'"
        flat
        color="transparent"
        class="appbar"
        density="comfortable"
      >
        <!-- 左側 Logo/標題 -->
        <v-app-bar-title class="appbar-title clickable" @click="goDashboard">
          🏘️ <span class="font-weight-bold">好鄰聚</span>
          <span class="text-medium-emphasis"> hood-link</span>
        </v-app-bar-title>

        <!-- 右側操作區 -->
        <template #append>
          <template v-if="isAuthed">
            <!-- 使用者頭像 -->
            <v-btn
              icon
              :to="{ name: 'me' }"
              :disabled="loadingUser"
              class="wiggle"
              aria-label="個人頁面"
            >
              <v-avatar size="36" class="soft-shadow">
                <template v-if="!loadingUser">
                  <v-img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="avatar" cover />
                  <span v-else aria-hidden="true">{{ userInitial }}</span>
                </template>
                <template v-else>
                  <v-skeleton-loader type="avatar" width="32" height="32" />
                </template>
              </v-avatar>
            </v-btn>

            <!-- 登出 -->
            <v-btn size="small" prepend-icon="mdi-logout" class="cta ml-2" @click="handleLogout">
              登出
            </v-btn>
          </template>

          <template v-else>
            <v-btn size="small" class="cta" :to="{ name: 'auth.login' }"> 登入 </v-btn>
          </template>
        </template>

        <!-- AppBar 底部旗串裝飾 -->
        <template #extension>
          <div class="bunting">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </template>
      </v-app-bar>

      <!-- 主內容（layout 控制容器寬） -->
      <v-main>
        <DefaultLayout v-if="layout === 'default'">
          <RouterView />
        </DefaultLayout>

        <AuthLayout v-else-if="layout === 'auth'">
          <RouterView />
        </AuthLayout>
      </v-main>

      <!-- Footer：透明底 + 上邊線（樣式在 theme.css 的 .footer） -->
      <v-footer
        v-if="layout !== 'auth'"
        app
        flat
        color="transparent"
        class="footer text-medium-emphasis"
      >
        <div class="mx-auto text-caption py-4">© {{ year }} 好鄰聚</div>
      </v-footer>
    </v-app>
  </div>
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
const { user, token } = storeToRefs(userStore)
const isAuthed = computed(() => !!token.value || !!localStorage.getItem('token'))
const loadingUser = ref(false)

const userInitial = computed(() => {
  const n = (user.value?.name || user.value?.email || 'U').trim()
  return n ? n[0].toUpperCase() : 'U'
})

onMounted(async () => {
  if (!isAuthed.value) return
  loadingUser.value = true
  try {
    await userStore.ensureUser?.(api)
  } finally {
    loadingUser.value = false
  }
})

const goDashboard = () => router.push({ name: 'app.dashboard' })
const handleLogout = () => {
  userStore.logout?.()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push({ name: 'auth.login' })
}

const year = new Date().getFullYear()
</script>

<style>
/* NOTE:
   - 寬度/背景/外框：在 base.css + main.css + theme.css 已處理（#app 滿版、.app-frame、奶油底）
   - AppBar / Footer 線條也在 theme.css：
     .appbar { border-bottom: 2px solid var(--c-ink); }
     .footer { border-top: 2px solid var(--c-ink); }
*/

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

/* 題頭字級微放大（若你已在 theme.css 設定，可移除此段） */
.appbar-title {
  font-size: 1.25rem;
  letter-spacing: 0.5px;
  color: var(--c-ink);
}
</style>
