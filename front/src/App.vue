<!-- src/App.vue -->
<template>
  <!-- 海報外框：樣式在 theme.css 的 .app-frame -->
  <div class="app-frame">
    <v-app>
      <!-- 共用 AppBar（登入/註冊頁不顯示） -->
      <div class="brand-badge clickable" @click="goDashboard">好鄰聚</div>
      <v-app-bar v-if="layout !== 'auth'" flat color="transparent" class="appbar ftc" height="72">
        <!-- 右側：粉紅 CTA + 使用者操作 -->
        <template #append>
          <div class="bar-right">
            <!-- 永遠顯示：到社群加入頁 -->
            <v-btn class="btn-bubble-pink text-lg-h5" :to="{ name: 'community.join' }"
              >😆加入社區!
            </v-btn>

            <template v-if="isAuthed">
              <v-btn
                icon
                :to="{ name: 'me' }"
                :disabled="loadingUser"
                class="ml-2"
                aria-label="個人頁面"
              >
                <v-avatar size="36">
                  <template v-if="!loadingUser">
                    <v-img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="avatar" cover />
                    <span v-else>{{ userInitial }}</span>
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
              <v-btn size="small" class="cta ml-2" :to="{ name: 'auth.login' }">登入</v-btn>
            </template>
          </div>
        </template>

        <!-- 底線（取代原本的旗串） -->
        <template #extension>
          <div class="appbar-underline"></div>
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
  background: var(--c-ink);
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
  font-size: 1.35rem;
  letter-spacing: 0.5px;
  color: var(--c-ink);
}

/* AppBar 容器 */
.appbar.ftc {
  position: relative;
  box-shadow: none !important;
  background: transparent !important;
}

/* 右側容器 */
.bar-right {
  display: flex;
  align-items: center;
  padding: 80px;
  margin-top: 25px;
}

/* 中央徽章（保留位置/樣式，可換圖） */
/* .brand-badge {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);

  color: #111;
  font-weight: 900;
  font-size: 2.5rem;
  font-family: HoodBrandTitle;
  letter-spacing: 0.4px;
  padding: 8px 14px;
} */
.brand-badge {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  /* 你的原有樣式 */
  color: #111;
  font-weight: 900;
  font-size: 4rem;
  font-family: HoodBrandTitle;
  letter-spacing: 0.4px;
  padding: 8px 14px;
  top: 15px;
  z-index: 1007;
  /* 雙層描邊效果 */
  text-shadow:
    /* 第一層：較粗的白色描邊 */
    -2px -2px 0 #fff,
    2px -2px 0 #fff,
    -2px 2px 0 #fff,
    2px 2px 0 #fff,
    -3px -3px 0 #fff,
    -3px 3px 0 #fff,
    3px -3px 0 #fff,
    3px 3px 0 #fff,
    /* 第二層：較細的黑色描邊，覆蓋在白色描邊之上 */ -4px -4px 0 #111,
    4px -4px 0 #111,
    -4px 4px 0 #111,
    4px 4px 0 #111;
}

/* 底線 */
.appbar-underline {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  height: 2px;
  background: #111;
  opacity: 0.9;
}

/* 既有：標題 hover & 可點 */
.clickable {
  cursor: pointer;
  user-select: none;
}
.appbar-title:hover {
  opacity: 0.85;
}

/* RWD 微調 */
@media (max-width: 960px) {
  .brand-badge {
    top: 18px;
    padding: 6px 12px;
    font-size: 0.98rem;
  }
}

.app-frame {
  position: relative;
}
</style>
