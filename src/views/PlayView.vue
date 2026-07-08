<template>
  <div class="play-page">
    <!-- 顶部栏 -->
    <div class="play-header">
      <button class="btn-icon" @click="quit">←</button>
      <div class="progress-bar">
        <div class="progress-fill" :style="{width: progressPct + '%'}"></div>
      </div>
      <div class="timer">⏱️ {{ formatTime(timeLeft) }}</div>
    </div>

    <!-- 加载/错误 -->
    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>加载题目中...</p>
    </div>
    <div class="error" v-else-if="error">
      <p>⚠️ {{ error }}</p>
      <button class="btn btn-primary" @click="quit">返回</button>
    </div>

    <!-- 答题区 -->
    <div class="question-area" v-else-if="question">
      <!-- 题号 -->
      <div class="q-index">第 {{ currentIndex + 1 }} / {{ questions.length }} 题</div>
      
      <!-- 题目文本 -->
      <div class="q-text">{{ question.text }}</div>

      <!-- 填空区 -->
      <div class="blanks-area">
        <template v-for="blank in question.blanks" :key="blank.id">
          <span class="blank-label">{{ blank.label }}:</span>
          <input
            type="text"
            class="blank-input"
            :placeholder="blank.hint || '输入答案'"
            v-model="allAnswers[currentIndex][blank.id]"
          />
        </template>
      </div>

      <!-- 导航按钮 -->
      <div class="nav-buttons">
        <button class="btn btn-nav" :disabled="currentIndex === 0" @click="prev">上一题</button>
        <button class="btn btn-nav" :disabled="currentIndex === questions.length - 1" @click="next">下一题</button>
      </div>

      <!-- 提交按钮 -->
      <button class="btn btn-submit" @click="submitAll" v-if="currentIndex === questions.length - 1">
        ✅ 提交答案
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game.js'
import { useProgressStore } from '../stores/progress.js'
import { useAuthStore } from '../stores/auth.js'
import { fetchQuestions } from '../lib/api.js'

const props = defineProps(['levelId'])
const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const progressStore = useProgressStore()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const questions = ref([])
const currentIndex = ref(0)
const allAnswers = ref([])
const timeLeft = ref(300)
const timer = ref(null)
const startTime = ref(0)

const question = computed(() => questions.value[currentIndex.value])
const progressPct = computed(() => ((currentIndex.value + 1) / questions.value.length) * 100)

onMounted(async () => {
  try {
    const [g, s, u, l] = props.levelId.split('-')
    const all = await fetchQuestions(Number(g), Number(s))
    questions.value = all.filter(q => q.unit === Number(u) && q.level === Number(l))
    
    if (questions.value.length === 0) {
      error.value = '该关卡暂无题目'
      loading.value = false
      return
    }
    
    allAnswers.value = questions.value.map(() => ({}))
    startTime.value = Date.now()
    loading.value = false
    
    timer.value = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) submitAll()
    }, 1000)
  } catch (e) {
    error.value = '加载失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

function prev() {
  if (currentIndex.value > 0) currentIndex.value--
}
function next() {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}
function quit() {
  if (confirm('确定要退出吗？进度将不会保存。')) {
    if (timer.value) clearInterval(timer.value)
    router.push('/')
  }
}
function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

async function submitAll() {
  if (timer.value) clearInterval(timer.value)
  
  const total = questions.value.length
  let correct = 0
  const mistakes = []
  
  questions.value.forEach((q, i) => {
    let qCorrect = true
    q.blanks.forEach(b => {
      const ans = (allAnswers.value[i][b.id] || '').trim()
      const ok = ans === String(b.answer)
      if (!ok) {
        qCorrect = false
        mistakes.push({
          question: q.text,
          blank_label: b.label,
          user_answer: ans || '(未答)',
          correct_answer: b.answer
        })
      }
    })
    if (qCorrect) correct++
  })
  
  const timeSeconds = Math.round((Date.now() - startTime.value) / 1000)
  
  // 保存进度
  const record = {
    level_id: props.levelId,
    correct_count: correct,
    total_count: total,
    time_seconds: timeSeconds,
    mistakes: mistakes.length,
    timestamp: Date.now()
  }
  progressStore.addRecord(record)
  if (authStore.student) {
    try {
      await import('../lib/api.js').then(m => m.saveProgress(authStore.student.id, record))
    } catch (e) { /* 静默失败 */ }
  }
  
  // 存结果到store供ResultView用
  gameStore.setResult({
    levelId: props.levelId,
    correct, total, time: timeSeconds, mistakes,
    score: Math.round((correct / total) * 100)
  })
  
  router.push({ name: 'result' })
}
</script>

<style scoped>
.play-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
}
.play-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.btn-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  font-size: 20px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.progress-bar {
  flex: 1; height: 8px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #52c41a;
  border-radius: 4px;
  transition: width 0.3s;
}
.timer {
  color: white;
  font-weight: bold;
  font-size: 16px;
  min-width: 60px;
  text-align: center;
}

.question-area {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
}
.q-index {
  text-align: center;
  color: #666;
  margin-bottom: 12px;
  font-size: 14px;
}
.q-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}
.blanks-area {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}
.blank-label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.blank-input {
  width: 120px;
  padding: 12px;
  font-size: 20px;
  text-align: center;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}
.blank-input:focus {
  border-color: #409eff;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-nav {
  flex: 1;
  background: #f0f0f0;
  color: #333;
}
.btn-nav:hover:not(:disabled) {
  background: #e0e0e0;
}
.btn-submit {
  width: 100%;
  background: #52c41a;
  color: white;
  font-size: 18px;
  padding: 16px;
}
.btn-submit:hover {
  background: #389e0d;
}

.loading, .error {
  text-align: center;
  padding: 60px 20px;
  color: white;
}
.spinner {
  width: 40px; height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
