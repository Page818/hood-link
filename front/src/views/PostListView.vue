<template>
  <v-container class="py-6" fluid>
    <BackToDashboard />

    <v-row justify="center">
      <v-col cols="12" style="max-width: 1200px">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="text-h6 font-weight-bold">貼文牆</h2>
          <v-btn color="primary" @click="goToCreate">新增貼文</v-btn>
        </div>

        <v-row>
          <!-- 分類選單 -->
          <v-col cols="12" md="3" style="min-width: 200px">
            <v-card flat class="pa-4">
              <h3 class="text-subtitle-1 mb-2">分類篩選</h3>
              <v-btn
                v-for="c in categories"
                :key="c"
                variant="text"
                class="mb-2 text-no-wrap"
                :color="filter === c ? 'primary' : ''"
                @click="filter = c"
              >
                {{ c }}
              </v-btn>
            </v-card>
          </v-col>

          <!-- 貼文清單 -->
          <v-col cols="12" md="9">
            <v-row>
              <v-col v-for="post in filteredPosts" :key="post._id" cols="12" sm="6" md="4">
                <v-card
                  class="pa-4 cursor-pointer"
                  hover
                  :ripple="true"
                  style="height: 200px"
                  @click="handleOpen(post)"
                >
                  <div class="text-subtitle-1 font-weight-medium mb-1">{{ post.title }}</div>
                  <div class="text-caption mb-2">{{ categoryName(post.category) }}</div>
                  <div class="text-truncate">{{ post.content }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { toId } from '@/utils/id'
import BackToDashboard from '@/components/BackToDashboard.vue'

const route = useRoute()
const router = useRouter()
const posts = ref([])
const filter = ref('全部')

const categories = ['全部', '鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']

const handleOpen = (post) => {
  if (!post?._id) return
  router.push({ name: 'post.detail', params: { id: post._id }, query: { filter: filter.value } })
}

const fetchPosts = async () => {
  try {
    const communityId = toId(route.params.communityId)
    console.log('✅ 正確取得 communityId:', communityId)

    const res = await api.get(`/posts/community/${communityId}`)
    console.log('🔥 API 回傳內容:', res.data)

    posts.value = res.data.items
  } catch (err) {
    console.error('❌ 無法取得貼文', err)
  }
}

const filteredPosts = computed(() => {
  if (filter.value === '全部') return posts.value || []
  return (posts.value || []).filter((p) => p.category === filter.value)
})

const categoryName = (key) => key || '未分類'

const goToCreate = () => {
  router.push(`/community/${route.params.communityId}/posts/create`)
}

watch(posts, (newVal) => {
  console.log('🧪 posts:', newVal)
})

onMounted(fetchPosts)
</script>
