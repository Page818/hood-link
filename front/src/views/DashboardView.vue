<!-- src/views/DashboardView.vue -->
<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <!-- 載入中 -->
    <v-progress-circular v-if="loading" indeterminate color="primary" />

    <!-- 載入完成後顯示主內容 -->
    <v-card v-else class="pa-6 text-center w-100" max-width="400" elevation="4">
      <!-- 歡迎詞 -->
      <h1 class="text-h6 mb-6" color="primary">歡迎回來，{{ user?.name || '使用者' }}</h1>

      <!-- 尚未加入社區 -->
      <div v-if="hasNoCommunity">
        <p class="text-subtitle-1 mb-2">你尚未加入任何社區</p>
        <v-btn color="primary" @click="router.push('/community/join')"> 加入社區 </v-btn>
      </div>

      <!-- 已加入社區 -->
      <div v-else-if="user && !hasNoCommunity">
        <v-select
          v-model="selectedCommunity"
          :items="user?.community || []"
          item-title="name"
          item-value="_id"
          label="選擇社區"
          return-object
          dense
          outlined
          rounded
          class="mb-6"
        />

        <div v-if="selectedCommunity" class="d-flex justify-center gap-4">
          <v-btn color="secondary" @click="goToCommunity">進入社區</v-btn>
          <v-btn v-if="isAdmin" color="primary" @click="goToAdmin">管理後台</v-btn>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const user = ref(null)
const loading = ref(true)
const selectedCommunity = ref(null)

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    const res = await api.get('/users/me')
    user.value = res.data.user

    // 若有社區，預設選第一個
    if (Array.isArray(user.value.community) && user.value.community.length > 0) {
      selectedCommunity.value = user.value.community[0]
    }
  } catch (err) {
    console.error('❌ 載入使用者資料失敗', err)
    localStorage.removeItem('token')
    alert('無法載入使用者資料，請重新登入')
    router.push('/login')
  } finally {
    loading.value = false
  }
})

// 安全判斷：是否尚未加入任何社區
const hasNoCommunity = computed(() => {
  // user 還沒載到，就視為「尚未加入社區」（避免渲染已加入社區區塊）
  if (!user.value) return true
  const arr = user.value.community
  return !Array.isArray(arr) || arr.length === 0
})

// 是否為該社區管理員
const isAdmin = computed(() => {
  const u = user.value
  const c = selectedCommunity.value
  if (!u || !c || !Array.isArray(c.admins)) return false
  // 依你的後端，可能是 u._id 而非 u.id
  return c.admins.includes(u._id || u.id)
})

// 導向社區大廳
const goToCommunity = () => {
  router.push(`/community/${selectedCommunity.value._id}`)
}

// 導向社區後台
const goToAdmin = () => {
  router.push(`/admin/community/${selectedCommunity.value._id}`)
}
</script>

<style scoped>
.v-card {
  position: relative;
  z-index: 9999;
}
</style>
