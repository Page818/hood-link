<!-- components/post/PostCard.vue -->
<template>
  <v-card class="hoverable" @click="$emit('click')">
    <v-img :src="post.image" height="180px" cover />

    <v-card-title class="text-subtitle-1 font-weight-bold">
      {{ post.title }}
    </v-card-title>

    <v-card-subtitle class="text-caption text-grey">
      {{ post.category }} · {{ formattedDate }}
    </v-card-subtitle>

    <v-card-text class="text-body-2"> {{ post.content.slice(0, 50) }}... </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  post: Object,
})

const formattedDate = computed(() => new Date(props.post.createdAt).toLocaleDateString())
</script>
