<!-- components/post/CategorySidebar.vue -->
<template>
  <v-card>
    <v-list nav dense>
      <v-list-item
        v-for="category in categories"
        :key="category"
        :value="category"
        @click="$emit('select', category)"
        :active="selected === category"
        color="primary"
      >
        <v-list-item-title>{{ category }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
defineProps({
  selected: String,
})

const categories = ['全部', '鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋']
</script>
