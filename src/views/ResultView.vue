<template>
  <div class="result-page">
    <div v-if="result">
      <h2>{{ result.score >= 60 ? '闯关成功！' : '继续加油！' }}</h2>

      <div class="score">得分: {{ result.score }}分</div>
      <div class="stats">
        <span>正确: {{ result.correct }}/{{ result.total }}</span>
        <span>用时: {{ formatTime(result.time) }}</span>
        <span>错题: {{ result.mistakes.length }}</span>
      </div>

      <div class="mistakes" v-if="result.mistakes.length > 0">
        <h3>错题回顾</h3>
        <div class="mistake-item" v-for="(m, i) in result.mistakes" :key="i">
          <div>{{ m.question }}</div>
          <div>你的: {{ m.user_answer }} | 正确: {{ m.correct_answer }}</div>
        </div>
      </div>

      <div class="actions">
        <button class="btn" @click="retry">再来一次</button>
        <button class="btn" @click="goUnit">返回单元列表</button>
        <button class="btn" @click="goHome">回首页</button>
      </div>
    </div>

    <div v-else>
      <p>暂无闯关记录</p>
      <button class="btn" @click="goHome">去闯关</button>
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
  if (result.value?.levelId) {
    router.push(`/play/${result.value.levelId}`)
  }
}
function goUnit() {
  const parts = result.value?.levelId?.split('-')
  if (parts && parts.length >= 2) {
    router.push(`/unit/${parts[0]}/${parts[1]}`)
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
  padding: 24px 16px;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}
.score {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin: 16px 0;
}
.stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
  color: #666;
}
.mistakes {
  text-align: left;
  margin: 24px 0;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
}
.mistakes h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.mistake-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ddd;
  font-size: 14px;
}
.mistake-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
.btn {
  padding: 12px 24px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 16px;
}
</style>
