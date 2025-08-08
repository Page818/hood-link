<template>
  <v-list class="pa-0" lines="two" nav dense>
    <v-list-subheader>公告列表</v-list-subheader>
    <v-divider></v-divider>

    <v-list-item
      v-for="item in announcements"
      :key="item._id"
      :value="item._id"
      :class="{ 'bg-grey-lighten-4': item._id === selectedId }"
      @click="$emit('select', item._id)"
    >
      <v-list-item-title>
        {{ item.title }}
        <v-icon v-if="item.pinned" color="orange" size="16" class="ml-1">mdi-pin</v-icon>
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ formatDate(item.updatedAt) }}
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup>
defineProps({
  announcements: Array,
  selectedId: String,
})
defineEmits(['select'])

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
