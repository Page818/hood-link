<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '@/stores/user' // 你專案路徑用 stores

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const token = computed(() => localStorage.getItem('token'))

// 已登入 → 若有社區，用第一個社區當首頁；否則去 app.dashboard
// 未登入 → 去登入頁
const defaultCommunityId = computed(() => userStore.user?.community?.[0]?._id || null)

const homeLink = computed(() => {
  if (!token.value) return { name: 'auth.login' }
  return defaultCommunityId.value
    ? { name: 'community.dashboard', params: { communityId: defaultCommunityId.value } }
    : { name: 'app.dashboard' }
})

function goHome() {
  const target = homeLink.value
  // ✅ 避免導向「同一路由」造成不必要的更新
  if (
    route.name === target.name &&
    JSON.stringify(route.params) === JSON.stringify(target.params || {})
  ) {
    return
  }
  router.push(target)
}
</script>

<template>
  <v-app>
    <v-app-bar app color="white" elevation="2">
      <v-container class="d-flex justify-space-between align-center">
        <!-- ✅ 用 named route，別再用 "/" -->
        <a class="text-decoration-none" @click.prevent="goHome">
          <h2 class="text-h6 font-weight-bold">好鄰聚 <span class="text-blue">hood-link</span></h2>
        </a>

        <!-- 右側：登入/註冊（未登入才顯示） -->
        <div class="d-flex gap-2">
          <RouterLink
            v-if="!token"
            :to="{ name: 'auth.login' }"
            class="text-caption text-decoration-none"
            >登入</RouterLink
          >
          <RouterLink
            v-if="!token"
            :to="{ name: 'auth.register' }"
            class="text-caption text-decoration-none"
            >註冊</RouterLink
          >

          <!-- 已登入可放「我的大廳」；可選 -->
          <RouterLink v-else :to="homeLink" class="text-caption text-decoration-none"
            >我的大廳</RouterLink
          >
        </div>
      </v-container>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
