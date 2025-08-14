<!-- 單一留言氣泡 -->
<!-- src/components/comments/CommentItem.vue-->

<template>
  <div class="d-flex align-start ga-3">
    <!-- 頭像 -->
    <v-avatar size="36">
      <template v-if="item.creator?.avatarUrl">
        <v-img :src="item.creator.avatarUrl" alt="avatar" cover />
      </template>
      <template v-else>
        <div
          class="w-100 h-100 d-flex align-center justify-center text-white"
          :style="{ backgroundColor: colorFromId(item.creator?._id || item.creator?.name || 'X') }"
        >
          <span class="text-body-2">{{ initials(item.creator?.name) }}</span>
        </div>
      </template>
    </v-avatar>

    <!-- 氣泡 -->
    <div class="bubble pa-3">
      <div class="d-flex align-center justify-space-between">
        <div class="text-caption text-medium-emphasis mb-1">
          {{ item.creator?.name || '使用者' }}
        </div>

        <!-- 只有作者本人能看到編輯刪除按鈕 -->
        <div v-if="isAuthor" class="d-flex ga-1">
          <v-btn size="x-small" variant="text" icon="mdi-pencil" @click="startEdit"></v-btn>
          <v-btn
            size="x-small"
            variant="text"
            icon="mdi-delete"
            color="error"
            @click="$emit('delete', item._id)"
          ></v-btn>
        </div>
      </div>

      <!-- 編輯模式 -->
      <div v-if="editing">
        <v-textarea
          v-model="editContent"
          variant="outlined"
          density="compact"
          auto-grow
        ></v-textarea>
        <div class="d-flex justify-end ga-2 mt-1">
          <v-btn size="small" @click="cancelEdit">取消</v-btn>
          <v-btn size="small" color="primary" @click="saveEdit">儲存</v-btn>
        </div>
      </div>

      <!-- 一般顯示模式 -->
      <div v-else class="text-body-2">{{ item.content }}</div>
      <div class="text-caption text-disabled mt-1">{{ formatTime(item.createdAt) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user.js'
import { toId } from '@/utils/id.js'

const props = defineProps({
  item: { type: Object, required: true },
  currentUserId: { type: String, required: true },
})

const emit = defineEmits(['update', 'delete'])
const userStore = useUserStore()

// 判斷是否為該留言作者
const isAuthor = computed(() => {
  // return toId(props.item.creator) === toId(props.currentUserId)
  const commentCreatorId = props.item?.creator ? toId(props.item.creator) : null
  const userId = props.currentUserId ? toId(props.currentUserId) : null
  return commentCreatorId && userId && commentCreatorId === userId
})

onMounted(() => {
  console.log('📝 Debug: 判斷作者', {
    commentCreator: props.item.creator,
    currentUser: props.currentUserId,
    isAuthor: isAuthor.value,
  })
})

// 編輯狀態
const editing = ref(false)
const editContent = ref('')

// 開始編輯
const startEdit = () => {
  editContent.value = props.item.content
  editing.value = true
}

// 取消編輯
const cancelEdit = () => {
  editing.value = false
}

// 儲存編輯
const saveEdit = () => {
  emit('update', { id: props.item._id, content: editContent.value })
  editing.value = false
}

// 取姓名縮寫（支援中文、英文）
const initials = (name = '') => {
  const n = name.trim()
  if (!n) return '用'
  const isAscii = /^[\x00-\x7F]+$/.test(n)
  return isAscii ? n[0].toUpperCase() : n.slice(0, 2)
}

// 根據 ID / 名稱生成穩定顏色
const colorFromId = (seed) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  const hue = h % 360
  return `hsl(${hue}, 55%, 55%)`
}

// 時間格式化
const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return ''
  }
}
</script>

<style scoped>
.bubble {
  background: var(--v-theme-surface-variant);
  border-radius: 14px;
  max-width: 520px;
}
</style>
