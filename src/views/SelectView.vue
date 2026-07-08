<template>
  <div class="select-page">
    <h1>🎮 小学数学闯关游戏</h1>
    <p class="subtitle">选择你的年级，开始闯关！</p>
    
    <div class="grade-grid">
      <div
        v-for="grade in 6"
        :key="grade"
        class="grade-card"
        :class="'grade-' + grade"
        @click="selectGrade(grade)"
      >
        <div class="grade-icon">{{ gradeIcons[grade - 1] }}</div>
        <div class="grade-num">{{ grade }}</div>
        <div class="grade-text">年级</div>
      </div>
    </div>
    
    <div class="bottom-actions">
      <button class="btn btn-secondary" @click="$router.push('/teacher')">👨‍🏫 教师入口</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const gradeIcons = ['🌱', '🌿', '🍀', '🌳', '🌲', '🏆']

function selectGrade(grade) {
  router.push(`/map/${grade}/2`)
}
</script>

<style scoped>
.select-page {
  padding: 40px 20px;
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
h1 {
  margin-bottom: 8px;
  color: white;
  font-size: 28px;
}
.subtitle {
  color: rgba(255,255,255,0.8);
  margin-bottom: 30px;
}
.grade-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 360px;
  margin: 0 auto;
}
.grade-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 3px solid transparent;
}
.grade-card:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
.grade-icon { font-size: 32px; margin-bottom: 4px; }
.grade-num { font-size: 36px; font-weight: bold; color: #333; }
.grade-text { font-size: 14px; color: #666; }

.grade-1 { border-color: #90EE90; }
.grade-2 { border-color: #87CEEB; }
.grade-3 { border-color: #DDA0DD; }
.grade-4 { border-color: #F0E68C; }
.grade-5 { border-color: #FFA07A; }
.grade-6 { border-color: #FF6B6B; }

.bottom-actions {
  margin-top: 40px;
}
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:hover { opacity: 0.9; }
.btn-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid white;
}
</style>
