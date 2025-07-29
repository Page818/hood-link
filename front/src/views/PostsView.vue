<!-- src/views/Posts.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const posts = ref([]);

async function fetchPosts() {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
    posts.value = response.data.slice(0, 5);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }
}

onMounted(fetchPosts);
</script>

<template>
  <div>
    <h1>好鄰聚 - 社區貼文</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.body }}</p>
        <small>By User {{ post.userId }}</small>
      </li>
    </ul>
  </div>
</template>

<style scoped>
h1 {
  color: #2c3e50;
  text-align: center;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
