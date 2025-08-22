<!-- src/components/admin/MemberAddDialog.vue -->
<template>
  <v-dialog v-model="model" max-width="600">
    <v-card>
      <v-card-title class="text-subtitle-1">新增成員</v-card-title>

      <v-card-text>
        <v-autocomplete
          v-model="selected"
          :items="items"
          :loading="loading"
          :search="search"
          item-title="__label"
          item-value="_id"
          label="搜尋手機 / LINE ID / 姓名 / Email"
          placeholder="輸入至少 2 個字開始搜尋"
          hide-no-data
          clearable
          return-object
          @update:search="onSearch"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw.__label" :subtitle="item.raw.__sub" />
          </template>
        </v-autocomplete>

        <!-- 預留 Cloudinary 上傳（附件） -->
        <div class="d-flex align-center ga-2 mt-2">
          <v-btn variant="text" prepend-icon="mdi-cloud-upload" @click="triggerUpload">
            附加檔案（預留）
          </v-btn>
          <span v-if="uploadedUrl" class="text-caption text-medium-emphasis"
            >已上傳：{{ uploadedUrl }}</span
          >
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn color="primary" :disabled="!selected" :loading="saving" @click="submit">加入</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/services/api'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'
import { toId } from '@/utils/id'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  communityId: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue', 'added'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/** 搜尋 */
const items = ref([])
const search = ref('')
const loading = ref(false)
const selected = ref(null)
let timer = null

const formatLabel = (u) => {
  const parts = []
  if (u.name) parts.push(u.name)
  if (u.phone) parts.push(`📱 ${u.phone}`)
  if (u.lineId) parts.push(`LINE: ${u.lineId}`)
  if (u.email) parts.push(`✉️ ${u.email}`)
  return {
    ...u,
    __label: parts[0] || u.email || u.phone || u.lineId || '(未命名)',
    __sub: parts.slice(1).join(' · '),
  }
}

const onSearch = (val) => {
  search.value = val
  clearTimeout(timer)
  if (!val || val.trim().length < 2) {
    items.value = []
    return
  }
  timer = setTimeout(fetchUsers, 300) // debounce
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/users/search', {
      params: { q: search.value.trim(), communityId: props.communityId },
    })
    items.value = (data?.results || []).map(formatLabel)
  } catch (err) {
    console.error('❌ 搜尋使用者失敗', err)
  } finally {
    loading.value = false
  }
}

/** 上傳（預留） */
const { pickAndUpload, lastResult } = useCloudinaryUploadSigned()
const uploadedUrl = computed(() => lastResult.value?.secure_url)
const triggerUpload = async () => {
  await pickAndUpload()
}

/** 送出 */
const saving = ref(false)
const close = () => (model.value = false)

const submit = async () => {
  if (!selected.value) return
  saving.value = true
  try {
    await api.patch(`/communities/${props.communityId}/members/add`, {
      userId: toId(selected.value),
    })
    emit('added')
  } catch (err) {
    console.error('❌ 新增成員失敗', err)
    alert(err?.response?.data?.message || '新增成員失敗')
  } finally {
    saving.value = false
  }
}
</script>
