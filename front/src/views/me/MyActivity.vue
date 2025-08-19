<!-- views/me/MeView.vue -->
<template>
  <div>
    <div class="d-flex align-center justify-space-between">
      <div class="text-subtitle-1 font-weight-medium">我的貼文</div>
      <div class="d-flex ga-2">
        <v-select
          v-model="postQ.category"
          :items="['全部', '鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']"
          density="comfortable"
          style="max-width: 180px"
        />
        <v-btn variant="tonal" @click="fetchMyPosts">重新整理</v-btn>
      </div>
    </div>
    <v-skeleton-loader v-if="loadingPosts" class="mt-3" type="card@3" />
    <v-alert v-else-if="postItems.length === 0" class="mt-3" variant="tonal"
      >目前沒有發表過貼文</v-alert
    >
    <v-row v-else class="mt-1">
      <v-col v-for="p in postItems" :key="p._id" cols="12" md="6" lg="4">
        <v-card class="h-100" @click="goPost(p)" hover>
          <v-card-title class="text-wrap">{{ p.title }}</v-card-title>
          <v-card-subtitle>{{ p.category }} · {{ fmt(p.createdAt) }}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex justify-center ga-2 my-4" v-if="postTotalPages > 1">
      <v-btn
        :disabled="postPage <= 1"
        @click="
          postPage--
          fetchMyPosts()
        "
        >上一頁</v-btn
      >
      <div class="d-flex align-center">第 {{ postPage }} / {{ postTotalPages }} 頁</div>
      <v-btn
        :disabled="postPage >= postTotalPages"
        @click="
          postPage++
          fetchMyPosts()
        "
        >下一頁</v-btn
      >
    </div>

    <v-divider class="my-6" />

    <div class="d-flex align-center justify-space-between">
      <div class="text-subtitle-1 font-weight-medium">我的回報</div>
      <div class="d-flex ga-2">
        <v-select
          v-model="reportQ.category"
          :items="['全部', '水電', '設備', '環境', '治安', '其他']"
          density="comfortable"
          style="max-width: 180px"
        />
        <v-select
          v-model="reportQ.status"
          :items="['全部', '待處理', '處理中', '已完成']"
          density="comfortable"
          style="max-width: 220px"
        />
        <v-btn variant="tonal" @click="fetchMyReports">重新整理</v-btn>
      </div>
    </div>
    <v-skeleton-loader v-if="loadingReports" class="mt-3" type="card@3" />
    <v-alert v-else-if="reportItems.length === 0" class="mt-3" variant="tonal"
      >目前沒有提交過回報</v-alert
    >
    <v-row v-else class="mt-1">
      <v-col v-for="r in reportItems" :key="r._id" cols="12" md="6" lg="4">
        <v-card class="h-100">
          <v-card-title class="text-wrap">{{ r.title }}</v-card-title>
          <v-card-subtitle>
            {{ r.category }} · <v-chip size="small" class="ml-1">{{ r.status || 'open' }}</v-chip>
          </v-card-subtitle>
          <v-card-text class="text-caption text-medium-emphasis"
            >建立於 {{ fmt(r.createdAt) }}</v-card-text
          >
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex justify-center ga-2 my-4" v-if="reportTotalPages > 1">
      <v-btn
        :disabled="reportPage <= 1"
        @click="
          reportPage--
          fetchMyReports()
        "
        >上一頁</v-btn
      >
      <div class="d-flex align-center">第 {{ reportPage }} / {{ reportTotalPages }} 頁</div>
      <v-btn
        :disabled="reportPage >= reportTotalPages"
        @click="
          reportPage++
          fetchMyReports()
        "
        >下一頁</v-btn
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const fmt = (t) => (t ? format(new Date(t), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : '')

// 貼文
const loadingPosts = ref(false)
const postItems = ref([])
const postTotal = ref(0)
const postPage = ref(1)
const postLimit = ref(9)
const postQ = ref({ category: '全部' })
const postTotalPages = computed(() => Math.max(1, Math.ceil(postTotal.value / postLimit.value)))

// 回報
const loadingReports = ref(false)
const reportItems = ref([])
const reportTotal = ref(0)
const reportPage = ref(1)
const reportLimit = ref(9)
const reportQ = ref({ category: '全部', status: '全部' })
const reportTotalPages = computed(() =>
  Math.max(1, Math.ceil(reportTotal.value / reportLimit.value)),
)

// 取我的貼文
async function fetchMyPosts() {
  loadingPosts.value = true
  try {
    await userStore.ensureUser?.(api)
    const params = {
      page: postPage.value,
      limit: postLimit.value,
      category: postQ.value.category !== '全部' ? postQ.value.category : undefined,
    }
    // 如果沒有 /users/me/posts，你可以先用 /posts?mine=1
    const { data } = await api.get('/users/me/posts', { params })
    postItems.value = data.items || data.posts || []
    postTotal.value = data.total ?? postItems.value.length
  } finally {
    loadingPosts.value = false
  }
}

// 取我的回報
async function fetchMyReports() {
  loadingReports.value = true
  try {
    await userStore.ensureUser?.(api)
    const params = {
      page: reportPage.value,
      limit: reportLimit.value,
      category: reportQ.value.category !== '全部' ? reportQ.value.category : undefined,
      status: reportQ.value.status !== '全部' ? reportQ.value.status : undefined,
    }
    // 如果沒有 /users/me/reports，你可以先用 /reports?mine=1
    const { data } = await api.get('/users/me/reports', { params })
    reportItems.value = data.items || data.reports || []
    reportTotal.value = data.total ?? reportItems.value.length
  } finally {
    loadingReports.value = false
  }
}

function goPost(p) {
  // 需有 community id 才能去詳情；若沒有，先不跳（MVP 可不提供）
  // this.$router.push({ name: 'post.detail', params: { communityId, postId: p._id }})
}

onMounted(() => {
  fetchMyPosts()
  fetchMyReports()
})
</script>
