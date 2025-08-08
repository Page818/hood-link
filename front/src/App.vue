<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <v-app>
    <!-- 頁首 -->
    <v-app-bar app color="white" elevation="2">
      <v-container class="d-flex justify-space-between align-center">
        <!-- 左側：LOGO / 專案名稱 -->
        <RouterLink to="/" class="text-decoration-none">
          <h2 class="text-h6 font-weight-bold">好鄰聚 <span class="text-blue">hood-link</span></h2>
        </RouterLink>

        <!-- 右側：登入 / 註冊連結 -->
        <div class="d-flex gap-2">
          <RouterLink to="/login" class="text-caption text-decoration-none">登入</RouterLink>
          <RouterLink to="/register" class="text-caption text-decoration-none">註冊</RouterLink>
        </div>
      </v-container>
    </v-app-bar>

    <!-- 路由顯示區 -->
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<style scoped>
.text-decoration-none {
  text-decoration: none;
  color: inherit;
}

.text-blue {
  color: #1976d2;
}

.gap-2 {
  gap: 8px;
}


</style>
