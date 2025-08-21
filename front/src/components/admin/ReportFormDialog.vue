<!-- src/components/admin/ReportFormDialog.vue -->
<template>
  <v-dialog v-model="isOpen" max-width="720">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? '編輯通報' : '新增通報' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field v-model="form.title" label="標題" :rules="[rules.required]" />
          <v-textarea v-model="form.description" label="描述" :rows="4" :rules="[rules.required]" />

          <div class="d-flex gap-4">
            <v-select
              class="flex-1"
              v-model="form.category"
              label="類別"
              :items="categories"
              :rules="[rules.required]"
            />
            <v-text-field class="flex-1" v-model="form.location" label="地點（選填）" />
          </div>

          <!-- 圖片上傳 -->
          <v-file-input
            label="上傳圖片（選填）"
            accept="image/*"
            :disabled="uploading"
            :multiple="false"
            prepend-icon="mdi-image"
            @update:modelValue="onPick"
          />
          <v-progress-linear v-if="uploading" :model-value="progress" height="6" class="mt-2" />
          <v-img
            v-if="form.image"
            :src="transform(form.image, 'w_800,q_auto,f_auto')"
            height="180"
            class="mt-4 rounded"
            cover
          />
          <div v-if="form.image" class="d-flex ga-2 mt-2">
            <v-btn size="small" variant="text" @click="openInNew">新視窗檢視</v-btn>
            <v-btn size="small" variant="text" @click="form.image = ''">移除圖片</v-btn>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text @click="emit('cancel')">取消</v-btn>
        <v-btn color="primary" :loading="loading" @click="handleSubmit">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'
import { toId } from '@/utils/id'

const props = defineProps({
  modelValue: Boolean,
  communityId: [String, Object],
  initialData: Object, // ⬅️ 新增：編輯模式用
})
const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const isOpen = ref(false)
watch(
  () => props.modelValue,
  (v) => (isOpen.value = v),
)
watch(isOpen, (v) => emit('update:modelValue', v))

const formRef = ref(null)
const loading = ref(false)
const form = ref({
  title: '',
  description: '',
  category: '其他',
  location: '',
  image: '',
})

// 🔁 監看初始資料（編輯模式預填）
watch(
  () => props.initialData,
  (val) => {
    if (!val) return
    form.value = {
      title: val.title ?? '',
      description: val.description ?? '',
      category: val.category ?? '其他',
      location: val.location ?? '',
      image: val.image ?? '',
    }
    formRef.value?.resetValidation?.()
  },
  { immediate: true },
)

const { uploadImageSigned, transform } = useCloudinaryUploadSigned()
const uploading = ref(false)
const progress = ref(0)

const onPick = async (files) => {
  const file = (Array.isArray(files) && files[0]) || files?.[0] || files
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const { secure_url } = await uploadImageSigned(file, (n) => (progress.value = n))
    form.value.image = secure_url
  } catch (e) {
    alert(e?.message || '圖片上傳失敗')
  } finally {
    uploading.value = false
  }
}
const openInNew = () => form.value.image && window.open(form.value.image, '_blank')

const rules = { required: (v) => !!v || '此欄位為必填' }
const categories = ['水電', '設備', '環境', '治安', '其他']
const isEdit = computed(() => !!props.initialData)

const handleSubmit = () => {
  if (!form.value.title || !form.value.description || !form.value.category) {
    alert('請填寫完整資料')
    return
  }
  emit('submit', {
    ...form.value,
    communityId: toId(props.communityId),
  })
  isOpen.value = false
}
</script>

<style scoped>
.gap-4 {
  gap: 1rem;
}
.flex-1 {
  flex: 1 1 0;
}
</style>
