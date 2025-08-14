<!-- 留言列表 + 輸入框 -->
<!-- src/components/comments/CommentsPane.vue -->

<template>
  <v-card class="h-100 d-flex flex-column">
    <!-- 標題 -->
    <div class="px-4 py-3 text-subtitle-1 font-weight-medium">留言</div>
    <v-divider />

    <!-- 留言列表 -->
    <div class="px-4 py-3 flex-1 overflow-y-auto">
      <v-skeleton-loader v-if="loading" type="list-item-two-line@4" />
      <template v-else>
        <div v-for="c in comments" :key="c._id" class="mb-4">
          <CommentItem :item="c" />
        </div>
        <div v-if="comments.length === 0" class="text-caption text-medium-emphasis">
          尚無留言，搶頭香吧！
        </div>
      </template>
    </div>

    <v-divider />

    <!-- 新增留言 -->
    <div class="px-3 py-3 d-flex ga-2">
      <v-text-field
        v-model="draft"
        density="comfortable"
        variant="outlined"
        placeholder="寫下留言…"
        hide-details
        @keydown.enter.exact.prevent="send"
      />
      <v-btn :loading="sending" @click="send">送出</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  postId: { type: String, required: true },
  sort: { type: String, default: 'oldest' },
})

const comments = ref([])
const loading = ref(true)
const draft = ref('')
const sending = ref(false)

// 抓留言列表
const fetchComments = async () => {
  if (!props.postId) return
  loading.value = true
  try {
    const { data } = await api.get(`/comments/post/${props.postId}`, {
      params: { sort: props.sort }, // 可傳 'latest' 或 'oldest'
    })
    comments.value = data.comments || []
  } catch (err) {
    console.error('❌ 無法取得留言', err)
  } finally {
    loading.value = false
  }
}

// 發送留言
const send = async () => {
  if (!draft.value.trim()) return
  sending.value = true
  try {
    const { data } = await api.post(`/comments/post/${props.postId}`, {
      content: draft.value,
    })

    // 後端 createComment 已經 populate 了 creator，所以可以直接用
    if (props.sort === 'latest') {
      comments.value.unshift(data.comment)
    } else {
      comments.value.push(data.comment)
    }

    draft.value = ''
  } catch (err) {
    console.error('❌ 無法發送留言', err)
  } finally {
    sending.value = false
  }
}

onMounted(fetchComments)
watch(() => props.postId, fetchComments)
</script>
