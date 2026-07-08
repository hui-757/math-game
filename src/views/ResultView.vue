<template>
  <div class="result-page">
    <!-- 关卡完成庆祝 -->
    <div class="celebration" v-if="result && result.score >= 60">
      <div class="trophy">🏆</div>
      <h2>🎉 闯关成功！</h2>
    </div>
    <div class="celebration" v-else-if="result">
      <div class="trophy">💪</div>
      <h2>继续加油！</h2>
    </div>

    <!-- 成绩卡 -->
    <div class="result-card" v-if="result">
      <div class="score-circle">
        <div class="score-num">{{ result.score }}</div>
        <div class="score-label">分</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ result.correct }}/{{ result.total }}</div>
          <div class="stat-label">正确</div>
        </div>
        <div class="stat">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ formatTime(result.time) }}</div>
          <div class="stat-label">用时</div>
        </div>
        <div class="stat">
          <div class="stat-icon">❌</div>
          <div class="stat-value">{{ result.mistakes.length }}</div>
          <div class="stat-label">错题</div>
        </div>
      </div>

      <!-- 错题本 -->
      <div class="mistakes" v-if="result.mistakes.length > 0">
        <h3>📖 错题回顾</h3>
        <div class="mistake-item" v-for="(m, i) in result.mistakes" :key="i">
          <div class="mistake-q">{{ m.question }}</div>
          <div class="mistake-ans">
            <span class="wrong">你的答案: {{ m.user_answer }}</span>
            <span class="right">正确答案: {{ m.correct_answer }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn btn-primary" @click="retry">🔄 再来一次</button>
        <button class="btn btn-secondary" @click="goMap">📍 返回地图</button>
        <button class="btn btn-secondary" @click="goHome">🏠 回首页</button>
      </div>
    </div>

    <!-- 无结果 -->
    <div class="no-result" v-else>
      <p>📭 暂无闯关记录</p>
      <button class="btn btn-primary" @click="goHome">去闯关</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game.js'

const router = useRouter()
const gameStore = useGameStore()

const result = computed(() => gameStore.lastResult)

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}分${sec}秒`
}

function retry() {
  if (result.value && result.value.levelId) {
    router.push(`/play/${result.value.levelId}`)
  }
}
function goMap() {
  // 从levelId解析grade/semester
  const parts = result.value?.levelId?.split('-')
  if (parts && parts.length >= 2) {
    router.push(`/map/${parts[0]}/${parts[1]}`)
  } else {
    router.push('/')
  }
}
function goHome() {
  router.push('/')
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
  text-align: center;
}
.celebration {
  margin-bottom: 24px;
  color: white;
}
.trophy {
  font-size: 64px;
  animation: bounce 1s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}
.celebration h2 {
  margin: 8px 0 0;
  font-size: 24px;
}

.result-card {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  max-width: 480px;
  margin: 0 auto;
}
.score-circle {
  width: 120px; height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #52c41a, #389e0d);
  margin: 0 auto 24px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 8px 20px rgba(82,196,26,0.3);
}
.score-num {
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
}
.score-label {
  font-size: 16px;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}
.stat {
  text-align: center;
}
.stat-icon {
  font-size: 28px;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.stat-label {
  font-size: 12px;
  color: #999;
}

.mistakes {
  text-align: left;
  margin: 24px 0;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 12px;
}
.mistakes h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.mistake-item {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ddd;
}
.mistake-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.mistake-q {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.mistake-ans {
  display: flex;
  gap: 16px;
  font-size: 14px;
}
.wrong { color: #ff4d4f; }
.right { color: #52c41a; }

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:hover { opacity: 0.9; }
.btn-primary {
  background: #52c41a;
  color: white;
}
.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.no-result {
  color: white;
  padding: 60px 20px;
}
.no-result p { font-size: 18px; margin-bottom: 20px; }
</style>
