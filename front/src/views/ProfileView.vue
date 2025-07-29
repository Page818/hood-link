<!-- src/views/Profile.vue -->
<script setup>
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
</script>

<template>
  <div>
    <h1>歡迎，{{ userStore.user?.name || '訪客' }}</h1>
    <button v-if="userStore.isAuthenticated" @click="userStore.logout">登出</button>
  </div>
</template>

<style scoped>
h1 {
  color: #2c3e50;
  text-align: center;
}
</style>
