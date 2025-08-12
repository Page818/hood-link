<!-- components/EventList.vue -->
<script setup>
const props = defineProps({
  events: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

function onClick(id) {
  if (!id || id === props.selectedId) return // 同 id 不回傳
  emit('select', id)
}

/* ❌ 千萬不要：
onMounted(() => emit('select', props.selectedId))
watch(() => props.selectedId, id => emit('select', id))
*/
</script>

<template>
  <v-skeleton-loader v-if="loading" type="list-item-two-line" />
  <v-list v-else>
    <v-list-item
      v-for="e in events"
      :key="e._id"
      :active="e._id === selectedId"
      @click="onClick(e._id)"
      :title="e.title"
      :subtitle="new Date(e.date).toLocaleString()"
    />
  </v-list>
</template>
