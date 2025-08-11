<!-- components/BackToDashboard.vue -->
<template>
  <v-btn
    prepend-icon="mdi-arrow-left"
    variant="outlined"
    color="primary"
    class="mb-4"
    @click="goBack"
  >
    返回社區大廳
  </v-btn>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useCommunityId } from '@/composables/useCommunityId'

const router = useRouter()
const { communityId } = useCommunityId()

function goBack() {
  // URL 有帶就回 /community/:communityId；否則導到加入社區
  if (communityId.value) {
    router.push({ name: 'community.dashboard', params: { communityId: communityId.value } })
  } else {
    router.push({ name: 'community.join' })
  }
}
</script>
