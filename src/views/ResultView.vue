<template>
  <div class="result-page">
    <h1>🎉 闯关结果</h1>
    <div class="result-card" v-if="result">
      <div class="score">
        <span class="score-num">{{ result.correct }}</span>
        <span class="score-total">/ {{ result.total }}</span>
      </div>
      <div class="stars">{{ stars }}</div>
      <div class="time">⏱ 用时 {{ formatTime }}</div>
      <div class="accuracy">正确率 {{ accuracy }}%</div>
    </div>
    <div class="result-card" v-else>
      <div class="empty">暂无结果，请先完成一关</div>
      <el-button type="primary" @click="goMap" style="margin-top: 20px">去闯关</el-button>
    </div>
    <div class="result-actions" v-if="result">
      <el-button type="primary" @click="retry">再试一次</el-button>
      <el-button type="success" @click="goMap">返回地图</el-button>
      <el-button @click="goReview">查看错题</el-button>
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
const correct = computed(() => result.value?.correct || 0)
const total = computed(() => result.value?.total || 0)
const time = computed(() => result.value?.time || 0)

const accuracy = computed(() => total.value ? Math.round(correct.value / total.value * 100) : 0)
const stars = computed(() => {
  const ratio = correct.value / total.value
  if (ratio >= 0.9) return '⭐⭐⭐'
  if (ratio >= 0.8) return '⭐⭐'
  if (ratio >= 0.6) return '⭐'
  return '💪'
})
const formatTime = computed(() => {
  const m = Math.floor(time.value / 60)
  const s = time.value % 60
  return `${m}分${s}秒`
})

function retry() { router.back() }
function goMap() { router.push('/') }
function goReview() { router.push('/review') }
</script>

<style scoped>
.result-page { padding: 40px 20px; text-align: center; }
.result-card { background: white; border-radius: 20px; padding: 40px; margin: 30px auto; max-width: 400px; }
.score { font-size: 64px; margin-bottom: 16px; }
.score-num { color: #409eff; font-weight: bold; }
.score-total { color: #999; font-size: 36px; }
.stars { font-size: 32px; margin: 16px 0; }
.time, .accuracy { color: #666; margin: 8px 0; font-size: 18px; }
.empty { color: #999; font-size: 18px; }
.result-actions { display: flex; gap: 12px; justify-content: center; margin-top: 30px; }
</style>
