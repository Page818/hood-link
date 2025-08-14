<template>
  <v-container class="py-8 post-detail-container">
    <BackToDashboard />

    <v-row>
      <!-- 貼文內容區 -->
      <v-col cols="12" md="8">
        <v-card>
          <!-- 貼文圖片 -->
          <v-img v-if="post?.image" :src="post.image" height="300" cover></v-img>

          <!-- 貼文內容 -->
          <v-card-title class="text-h6 font-weight-bold">
            {{ post?.title }}
          </v-card-title>

          <v-card-subtitle>
            {{ post?.category }}・{{ formatTime(post?.createdAt) }}
          </v-card-subtitle>

          <v-card-text>
            {{ post?.content }}
          </v-card-text>

          <!-- 返回按鈕（僅手機顯示） -->
          <v-card-actions>
            <v-btn v-if="isMobile" color="primary" @click="goBack"> 返回列表 </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 留言區 -->
      <v-col cols="12" md="4">
        <CommentsPane :postId="postId" :communityId="communityId" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api.js'
import BackToDashboard from '@/components/BackToDashboard.vue'
import { useDisplay } from 'vuetify'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import CommentsPane from '@/components/comments/CommentsPane.vue'

// 取得 route 與 router
const route = useRoute()
const router = useRouter()

// 響應式判斷是否為手機
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// 格式化時間
const formatTime = (time) => {
  if (!time) return ''
  return format(new Date(time), 'yyyy-MM-dd HH:mm', { locale: zhTW })
}

// API 資料
const post = ref(null)
const loading = ref(false)
const error = ref(null)

// 從 URL 拿社區與貼文 ID
const communityId = computed(() => route.params.communityId)
const postId = computed(() => route.params.postId)

// 取得貼文
const fetchPost = async () => {
  try {
    loading.value = true
    const res = await api.get(`/posts/community/${communityId.value}/posts/${postId.value}`)
    post.value = res.data.post
  } catch (err) {
    error.value = err.response?.data?.message || '無法取得貼文'
  } finally {
    loading.value = false
  }
}

// 返回上一頁
const goBack = () => {
  router.push(`/community/${communityId.value}/posts`)
}

// 初始化
onMounted(() => {
  fetchPost()
})
</script>

<style scoped>
.post-detail-container {
  max-width: 1200px; /* 最大寬度 */
  width: 1200px;
  margin: 0 auto; /* 置中 */
}
</style>
