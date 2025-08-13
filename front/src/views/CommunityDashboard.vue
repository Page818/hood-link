<!-- /views/communityDashboard.vue -->
<template>
  <v-container class="py-10">
    <!-- 歡迎區塊 -->
    <div class="text-center mb-10">
      <h1 class="text-h5 font-weight-bold">{{ communityName }}</h1>
      <p class="text-subtitle-2">歡迎來到 {{ communityName }} 社區！</p>
    </div>

    <!-- 功能卡片區塊 -->
    <v-row>
      <v-col v-for="(item, index) in features" :key="index" cols="12" sm="6" class="mb-6">
        <v-card class="text-center py-6" elevation="4" @click="navigateTo(item.name)" hover>
          <v-icon size="48" class="mb-2">{{ item.icon }}</v-icon>
          <div class="text-subtitle-1 font-weight-medium">{{ item.title }}</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, watch } from 'vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

// ✅ 統一使用 communityId（URL 優先）
const communityId = computed(() => route.params.communityId)

const communityName = ref('')
const loading = ref(true)

async function fetchCommunityName() {
  if (!communityId.value) return
  loading.value = true
  try {
    const { data } = await api.get('/users/me')
    const user = data.user
    const matched = user?.community?.find((c) => (c._id || c) === communityId.value)
    communityName.value = matched ? matched.name : '未知社區'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCommunityName)

// ✅ 監聽網址中的 communityId 變化
watch(
  () => communityId.value,
  (newId, oldId) => {
    if (newId && newId !== oldId) fetchCommunityName()
  },
)

// ✅ 功能清單：改用「路由名稱」
const features = [
  { title: '最新公告', icon: 'mdi-bullhorn-outline', name: 'community.announcements' },
  { title: '好鄰交流', icon: 'mdi-message-text-outline', name: 'community.posts' },
  { title: '異常回報', icon: 'mdi-map-marker-alert-outline', name: 'community.reports' },
  { title: '活動列表', icon: 'mdi-calendar-heart', name: 'community.events' },
]

// ✅ 導頁一律用 name + params，避免漏參數
function navigateTo(routeName) {
  if (!communityId.value) return
  router.push({ name: routeName, params: { communityId: communityId.value } })
}
</script>
