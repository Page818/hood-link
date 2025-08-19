<!-- /components/comments/CommentsPane.vue -->
<template>
  <v-card class="h-100 d-flex flex-column">
    <div class="px-4 py-3 text-subtitle-1 font-weight-medium">留言</div>
    <v-divider />

    <!-- 內容區 -->
    <div class="px-4 py-3 flex-1 overflow-y-auto">
      <v-skeleton-loader v-if="loading" type="list-item-two-line@4" />
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

      <template v-else>
        <div v-for="c in comments" :key="c._id" class="mb-4">
          <CommentItem :item="c" :currentUserId="myId" @update="handleUpdate" />
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
        :disabled="!isAuthed"
        @keydown.enter.exact.prevent="submit"
      />
      <v-btn :loading="sending" :disabled="!draft.trim() || !isAuthed" @click="submit">送出</v-btn>
    </div>

    <v-alert v-if="!isAuthed" type="info" variant="tonal" class="mx-4 mb-3">
      請先登入以留言
    </v-alert>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/services/api.js'
import CommentItem from './CommentItem.vue'
import { useUserStore } from '@/stores/user.js'
import { toId } from '@/utils/id.js'

const props = defineProps({
  postId: { type: String, required: true },
  sort: { type: String, default: 'oldest' }, // 'latest' | 'oldest'
  currentUserId: { type: [String, Number, Object], required: false, default: '' },
})
const emit = defineEmits(['updated']) // 父層可用來同步留言數

const userStore = useUserStore()

// 使用者
const myId = computed(() => {
  return toId(props.currentUserId) || toId(userStore.user)
})
const isAuthed = computed(() => Boolean(myId.value))

// 狀態
const comments = ref([])
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const draft = ref('')

// 先確保已拉到 user（避免刷新後 myId 永遠 undefined）
async function ensureUser() {
  try {
    await userStore.ensureUser?.(api)
  } catch {}
}

async function fetchComments() {
  if (!props.postId) return
  loading.value = true
  error.value = ''
  try {
    await ensureUser()
    const { data } = await api.get(`/comments/post/${props.postId}`, {
      params: { sort: props.sort },
    })
    comments.value = data.comments || data.items || []
    emit('updated', comments.value.length)
  } catch (e) {
    error.value = e?.response?.data?.message || '載入留言失敗'
  } finally {
    loading.value = false
  }
}

async function submit() {
  const content = draft.value.trim()
  if (!content || !isAuthed.value) return
  sending.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/comments/post/${props.postId}`, { content })
    const created = data.comment || data
    if (!created.creator) {
      created.creator = userStore.user || { _id: myId.value }
    }
    if (props.sort === 'latest') comments.value.unshift(created)
    else comments.value.push(created)
    draft.value = ''
    emit('updated', comments.value.length)
  } catch (e) {
    error.value = e?.response?.data?.message || '留言失敗'
  } finally {
    sending.value = false
  }
}

async function handleUpdate({ id, content }) {
  try {
    const { data } = await api.put(`/comments/${id}`, { content })
    const updated = data.comment || data
    const i = comments.value.findIndex((c) => c._id === id)
    if (i !== -1) comments.value[i] = updated
  } catch (e) {
    error.value = e?.response?.data?.message || '更新留言失敗'
  }
}

onMounted(fetchComments)
watch(() => props.postId, fetchComments)
watch(() => props.sort, fetchComments)
</script>
