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
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const communityId = route.params.id

const goBack = () => {
  router.push(`/community/${communityId}`)
}
</script>
