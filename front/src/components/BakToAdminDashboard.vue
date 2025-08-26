<script setup>
import { useRouter, useRoute } from 'vue-router'
import { toId } from '@/utils/id.js'

const props = defineProps({
  label: { type: String, default: '返回管理大廳' },
  communityId: { type: String, required: false },
})

const router = useRouter()
const route = useRoute()

const goBack = () => {
  // 1) 優先使用 props 傳入的 communityId
  const id = props.communityId || toId(route.params.communityId)

  if (!id) {
    console.error('❌ 缺少 communityId，無法返回管理大廳')
    return
  }

  router.push(`/admin/community/${id}`)
}
</script>

<template>
  <v-btn class="btn-bubble-pink mb-4 text-lg-h5 text-md-h6" @click="goBack">
    {{ label }}
  </v-btn>
</template>
