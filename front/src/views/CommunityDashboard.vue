<!-- /views/communityDashboard.vue -->
<template>
  <v-container class="py-10">
    <!-- 歡迎區塊 -->
    <div class="text-center mb-10 text-aria">
      <h1 class="font-weight-bold">{{ communityName }}</h1>
      <div class="marquee-wrapper">
        <p class="marquee-text">
          歡迎來到 {{ communityName }} 社區! 選擇下方的區塊以進入各功能頁面~
        </p>
      </div>
    </div>

    <!-- 功能卡片區塊 -->
    <v-row>
      <v-col v-for="(item, index) in features" :key="index" cols="12" sm="6" class="mb-6">
        <v-card
          class="card-news clickable"
          :class="[item.effect]"
          flat
          :elevation="0"
          :ripple="false"
          @click="navigateTo(item.name)"
        >
          <div class="card-inner">
            <v-icon size="48" class="tile-icon">{{ item.icon }}</v-icon>
            <div>
              <div class="tile-title">{{ item.title }}</div>
              <div class="rule"></div>
              <div class="tile-sub">點擊進入 {{ item.title }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, watch } from 'vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

const communityId = computed(() => route.params.communityId)
const communityName = ref('')
const loading = ref(true)

async function fetchCommunityName() {
  if (!communityId.value) return
  loading.value = true
  try {
    const { data } = await api.get('/users/me')
    const user = data.user
    const matched = user?.community?.find((c) => (c._id || c) === communityId.value)
    communityName.value = matched ? matched.name : '未知社區'
  } finally {
    loading.value = false
  }
}
onMounted(fetchCommunityName)

watch(
  () => communityId.value,
  (n, o) => {
    if (n && n !== o) fetchCommunityName()
  },
)

const features = [
  {
    title: '最新公告',
    icon: 'mdi-bullhorn-outline',
    name: 'community.announcements',
    effect: 'ani-announcement',
  },
  {
    title: '好鄰交流',
    icon: 'mdi-message-text-outline',
    name: 'community.posts',
    effect: 'ani-posts',
  },
  {
    title: '異常回報',
    icon: 'mdi-map-marker-alert-outline',
    name: 'reports.create',
    effect: 'ani-reports',
  },
  {
    title: '活動列表',
    icon: 'mdi-calendar-heart',
    name: 'community.events',
    effect: 'ani-events',
  },
]

function navigateTo(routeName) {
  if (!communityId.value) return
  router.push({ name: routeName, params: { communityId: communityId.value } })
}
</script>

<style>
/* tokens（就地定義，與 theme 對齊） */
:root {
  --cream: #fff7ec;
  --ink-strong: #1f2937;
  --brickRed: #b22222;
  --posterBlue: #1976d2;
  --grassGreen: #228b22;
  --primary: #ff7a59;
  --secondary: #00a6a6;
}
/* 歡迎區塊 */
.text-aria {
  display: block;
  background: var(--tx-paper-dark);
  background-size: 300px auto;

  background-repeat: repeat;

  /* pointer-events: none; */
  border-bottom: 4px solid var(--ink-strong);
}

.text-aria h1 {
  font-family: 'HoodBrandTitle';
  color: var(--cream);
  font-size: 2rem;
}
.marquee-wrapper {
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
  position: relative;
  height: 1.5em;
}
.text-aria p {
  font-family: 'HoodBrandTitle';
  color: var(--cream);
  font-size: 1.2rem;
}
.marquee-text {
  animation: floatText 2.5s ease-in-out infinite;
}

@keyframes floatText {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
/* ====== 卡片基礎：奶油底 + 厚框 + 強紙紋 ====== */
.v-card.card-news {
  background-color: transparent !important; /* 讓下面的紙質層決定顏色 */
  border: 3px solid var(--ink-strong) !important; /* 粗框 */
  border-radius: 16px !important;
  box-shadow: none !important; /* 避免預設陰影干擾 */
  position: relative;
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    filter 0.25s ease;
}

.card-news .card-inner {
  position: relative;
  z-index: 2;
  padding: 28px 32px;
  display: grid;
  grid-template-columns: 56px auto;
  gap: 16px;
  align-items: center;
}

.v-card.card-news::before,
.v-card.card-news::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
}

/* 粗顆粒（偏大） */
.v-card.card-news::before {
  content: '';
  background: url('/assets/textures/cardboard-1920x1080.png') repeat;
  background-size: 520px auto;
  mix-blend-mode: multiply;
  opacity: 0.88;
  filter: contrast(1.08) brightness(1.02);
}
/* 細顆粒（偏小） */
.v-card.card-news::after {
  content: '';
  background: transparent url('/assets/textures/paper.png') repeat;
  background-size: 360px auto;
  mix-blend-mode: multiply;
  opacity: 0.38;
  filter: contrast(1.12);
}
/* hover：明顯浮起陰影 */
.v-card.card-news:hover {
  transform: translateY(-6px);
  /* 下壓+大片柔陰影，復古印刷立體感 */
  box-shadow: 0 6px 0 var(--ink-strong) !important;
  border: 4px solid var(--ink-strong) !important;
  .tile-icon {
    color: var(--brickRed);
  }
}
/* 內部排版 */
.card-inner {
  position: relative;
  z-index: 1;
  padding: 28px 32px;
  display: grid;
  grid-template-columns: 56px auto;
  gap: 16px;
  align-items: center;
}

.tile-title {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--ink-strong);
}
.tile-sub {
  font-size: 0.86rem;
  color: #6b7280;
}

.rule {
  height: 2px;
  background: repeating-linear-gradient(to right, var(--ink-strong) 0 12px, transparent 12px 16px);
  opacity: 0.95;
  margin: 6px 0 8px;
}

/* hover：輕微抬起 + 彩色套印陰影 */
.card-news:hover {
  transform: translateY(-6px);
  box-shadow:
    0 6px 0 var(--ink-strong),
    0 20px 30px rgba(0, 0, 0, 0.18);
}

/* ====== 每張卡片自己的動畫 ====== */

/* ====== Announcement (公告) - hover大跳動 ====== */
@keyframes bigJump {
  0%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-12px);
  }
  60% {
    transform: translateY(6px);
  }
}
.ani-announcement:hover {
  animation: bigJump 0.6s ease;
}

/* ====== Posts (交流) - 卡片 bounce 彈跳（自動循環） ====== */
@keyframes bounceCard {
  0%,
  100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-8px);
  }
  50% {
    transform: translateY(4px);
  }
  75% {
    transform: translateY(-4px);
    color: var(--primary);
  }
}
.ani-posts {
  animation: bounceCard 3.5s ease-in-out infinite;
  animation-delay: 0.3s;
}

/* ====== Reports (異常) - icon旋轉====== */
@keyframes spinIcon {
  0% {
    transform: rotate(0);
  }
  20% {
    transform: rotate(20deg);
  }
  40% {
    transform: rotate(-20deg);
  }
  60% {
    transform: rotate(15deg);
    color: var(--secondary);
  }
  80% {
    transform: rotate(-15deg);
  }
  100% {
    transform: rotate(0);
  }
}
.ani-reports .tile-icon {
  display: inline-block;
  animation: spinIcon 6s ease-in-out infinite;
  animation-delay: 0.6s;
  /* filter: grayscale(100%) contrast(120%); */
}

/* ====== Events (活動) - 卡片閃爍 ====== */
@keyframes flashCard {
  0%,
  100% {
    filter: brightness(1);
  }
  45% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.55);
  }
  55% {
    filter: brightness(1);
  }
}
.ani-events {
  animation: flashCard 5s linear infinite;
  animation-delay: 0.9s;
}

.ani-posts:hover,
.ani-reports:hover,
.ani-events:hover {
  animation-play-state: paused;
}
.clickable {
  cursor: pointer;
}
</style>
