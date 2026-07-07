<template>
  <div class="select-page">
    <h1>🎮 小学数学闯关游戏</h1>
    <div class="grade-grid">
      <div
        v-for="grade in 6"
        :key="grade"
        class="grade-card"
        @click="selectGrade(grade)"
      >
        <div class="grade-num">{{ grade }}</div>
        <div class="grade-text">年级</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function selectGrade(grade) {
  // 默认进下册，之后可扩展学期选择
  router.push(`/map/${grade}/2`)
}
</script>

<style scoped>
.select-page {
  padding: 40px 20px;
  text-align: center;
}
h1 {
  margin-bottom: 30px;
  color: #333;
}
.grade-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
}
.grade-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s;
}
.grade-card:hover {
  transform: translateY(-4px);
}
.grade-num {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
}
.grade-text {
  font-size: 18px;
  color: #666;
  margin-top: 8px;
}
</style>
