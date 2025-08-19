<template>
  <div class="d-flex align-start ga-3">
    <!-- 頭像 -->
    <v-avatar size="36">
      <template v-if="avatarUrl">
        <v-img :src="avatarUrl" alt="avatar" cover />
      </template>
      <template v-else>
        <div
          class="w-100 h-100 d-flex align-center justify-center text-white"
          :style="{ backgroundColor: colorFromId(colorSeed) }"
        >
          <span class="text-body-2">{{ initials(displayName) }}</span>
        </div>
      </template>
    </v-avatar>

    <!-- 氣泡 -->
    <div class="bubble pa-3">
      <div class="d-flex align-center justify-space-between">
        <div class="text-caption text-medium-emphasis mb-1">
          {{ displayName }}
        </div>

        <!-- 只有作者本人能看到編輯刪除按鈕 -->
        <div v-if="isAuthor" class="d-flex ga-1">
          <v-btn
            size="x-small"
            variant="text"
            icon="mdi-pencil"
            :aria-label="'編輯留言'"
            @click="startEdit"
          />
        </div>
      </div>

      <!-- 編輯模式 -->
      <div v-if="editing">
        <v-textarea v-model="editContent" variant="outlined" density="compact" auto-grow />
        <div class="d-flex justify-end ga-2 mt-1">
          <v-btn size="small" @click="cancelEdit">取消</v-btn>
          <v-btn size="small" color="primary" @click="saveEdit">儲存</v-btn>
        </div>
      </div>

      <!-- 一般顯示模式 -->
      <div v-else class="text-body-2">{{ item.content || '' }}</div>
      <div class="text-caption text-disabled mt-1">{{ formatTime(item.createdAt) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { toId } from '@/utils/id.js'

const props = defineProps({
  item: { type: Object, required: true },
  // 放寬型別與必填，避免使用者資訊尚未載入時出警告
  currentUserId: { type: [String, Number, Object], required: false, default: '' },
})

const emit = defineEmits(['update', 'delete'])

// 作者判斷（同時避免 '' 與 null 誤判）
const creatorId = computed(() => toId(props.item?.creator))
const myId = computed(() => toId(props.currentUserId))
const isAuthor = computed(() => !!creatorId.value && !!myId.value && creatorId.value === myId.value)

onMounted(() => {
  // 需要時可保留 debug
  // console.log('📝 Debug', { creatorId: creatorId.value, myId: myId.value, isAuthor: isAuthor.value })
  console.debug('[CommentItem]', {
    commentId: props.item._id,
    creatorId: creatorId.value,
    myId: myId.value,
    isAuthor: isAuthor.value,
  })
})

// 顯示資料
const displayName = computed(() => props.item?.creator?.name || '使用者')
const avatarUrl = computed(() => props.item?.creator?.avatarUrl || '')
const colorSeed = computed(() => props.item?.creator?._id || props.item?.creator?.name || 'X')

// 編輯狀態
const editing = ref(false)
const editContent = ref('')

// 開始編輯
const startEdit = () => {
  editContent.value = props.item?.content || ''
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

// 取姓名縮寫（支援中英文）
const initials = (name = '') => {
  const n = (name || '').trim()
  if (!n) return '用'
  const isAscii = /^[\x00-\x7F]+$/.test(n)
  return isAscii ? n[0].toUpperCase() : n.slice(0, 2)
}

// 根據 ID / 名稱生成穩定顏色
const colorFromId = (seed = 'X') => {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  const hue = h % 360
  return `hsl(${hue}, 55%, 55%)`
}

// 時間格式化（避免 Invalid Date）
const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}
</script>

<style scoped>
.bubble {
  background: var(--v-theme-surface-variant);
  border-radius: 14px;
  max-width: 520px;
}
</style>
