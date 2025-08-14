<script setup>
import { useRouter, useRoute } from 'vue-router'
import { toId } from '@/utils/id.js'

const props = defineProps({
  label: { type: String, default: '返回社區大廳' },
  communityId: { type: String, required: true },
})

const router = useRouter()
const route = useRoute()

const goBack = () => {
  const communityId = toId(route.params.communityId)
  if (!communityId) {
    console.error('❌ 缺少 communityId，無法返回大廳')
    return
  }
  router.push(`/community/${communityId}`)
}
</script>

<template>
  <v-btn variant="text" @click="goBack">
    {{ label }}
  </v-btn>
</template>
