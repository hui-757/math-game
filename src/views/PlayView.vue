<template>
  <div class="play-page">
    <div class="play-header">
      <el-button @click="$router.back()" type="primary" plain>← 返回地图</el-button>
      <div class="progress">{{ currentIndex + 1 }} / {{ questions.length }}</div>
      <div class="timer">⏱ {{ formatTime }}</div>
    </div>
    
    <div class="loading" v-if="loading">
      <el-icon><Loading /></el-icon> 加载题目中...
    </div>
    
    <div class="error" v-else-if="error">
      <el-icon><Warning /></el-icon> {{ error }}
      <el-button @click="$router.back()" style="margin-top: 16px">返回地图</el-button>
    </div>
    
    <div class="question-area" v-else-if="currentQuestion">
      <div class="question-display">
        <div v-for="(line, li) in currentQuestion.content.lines" :key="li" class="question-line">
          <template v-for="(part, pi) in line" :key="pi">
            <span v-if="part.type === 'text'">{{ part.text }}</span>
            <input
              v-else
              type="text"
              inputmode="numeric"
              class="math-blank"
              :value="allAnswers[currentIndex]?.[part.id] || ''"
              @input="updateAnswer(part.id, $event.target.value)"
              maxlength="8"
            />
          </template>
        </div>
      </div>
    </div>
    
    <div class="play-actions" v-if="!loading && !error && questions.length > 0">
      <el-button type="primary" size="large" @click="submitAnswer" v-if="currentIndex < questions.length - 1">下一题</el-button>
      <el-button type="success" size="large" @click="submitAll" v-else>提交闯关</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game.js'
import { useAuthStore } from '../stores/auth.js'
import { useProgressStore } from '../stores/progress.js'
import { fetchQuestions, submitProgress } from '../lib/api.js'

const props = defineProps(['levelId'])
const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const questions = ref([])
const allAnswers = ref([])  // 每道题的答案，直接存储
const timer = ref(0)
const loading = ref(true)
const error = ref('')
let timerInterval

const currentIndex = computed(() => gameStore.currentIndex)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const formatTime = computed(() => {
  const m = Math.floor(timer.value / 60)
  const s = timer.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

onMounted(async () => {
  try {
    authStore.loadFromStorage()
    const [grade, semester, unit, level] = props.levelId.split('-').map(Number)
    
    const all = await fetchQuestions(grade, semester)
    questions.value = all.filter(q => q.unit === unit && q.level === level)
    allAnswers.value = new Array(questions.value.length).fill(null).map(() => ({}))
    
    if (questions.value.length === 0) {
      error.value = '该关卡暂无题目'
      loading.value = false
      return
    }
    
    gameStore.initGame(questions.value, props.levelId)
    timerInterval = setInterval(() => { timer.value++ }, 1000)
    loading.value = false
  } catch (e) {
    error.value = '加载题目失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})

function updateAnswer(blankId, value) {
  if (!allAnswers.value[currentIndex.value]) {
    allAnswers.value[currentIndex.value] = {}
  }
  allAnswers.value[currentIndex.value][blankId] = value
}

function submitAnswer() {
  gameStore.nextQuestion()
}

async function submitAll() {
  clearInterval(timerInterval)
  gameStore.finishGame()
  
  let correct = 0
  const mistakes = []
  questions.value.forEach((q, idx) => {
    const qAnswers = allAnswers.value[idx] || {}
    const isCorrect = checkQuestion(q, qAnswers)
    if (isCorrect) correct++
    else mistakes.push({ questionId: q.id, userAnswer: qAnswers, correctAnswer: getCorrectAnswers(q) })
  })
  
  if (authStore.student) {
    await submitProgress({
      student_id: authStore.student.id,
      level_id: props.levelId,
      correct_count: correct,
      total_count: questions.value.length,
      time_seconds: gameStore.elapsedTime,
      mistakes: mistakes
    })
  }
  
  // 无论是否登录，都保存到 localStorage（progressStore 会处理）
  progressStore.addRecord({
    level_id: props.levelId,
    correct_count: correct,
    total_count: questions.value.length,
    time_seconds: gameStore.elapsedTime,
    mistakes: mistakes
  })
  
  gameStore.setResult({ correct, total: questions.value.length, time: gameStore.elapsedTime, mistakes })
  router.push({ name: 'result' })
}

function extractBlanks(content) {
  const blanks = []
  if (!content || !content.lines) return blanks
  content.lines.forEach(line => {
    if (Array.isArray(line)) {
      line.forEach(part => {
        if (part.type === 'blank') blanks.push(part)
      })
    }
  })
  return blanks
}

function checkQuestion(q, userAnswers) {
  const blanks = extractBlanks(q.content)
  if (blanks.length === 0) return false
  return blanks.every(b => {
    const user = (userAnswers[b.id] || '').trim()
    return user === b.answer.trim()
  })
}

function getCorrectAnswers(q) {
  const result = {}
  extractBlanks(q.content).forEach(b => { result[b.id] = b.answer })
  return result
}
</script>

<style scoped>
.play-page { padding: 20px; max-width: 600px; margin: 0 auto; }
.play-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.progress { font-size: 18px; font-weight: bold; }
.timer { font-size: 18px; color: #666; }
.loading, .error { text-align: center; padding: 60px 20px; color: #999; }
.error { color: #f56c6c; }
.question-area { background: white; border-radius: 16px; padding: 40px; margin-bottom: 20px; }
.question-line { font-size: 24px; line-height: 2; margin: 10px 0; }
.play-actions { text-align: center; }
.math-blank {
  width: 3.5rem;
  height: 2.5rem;
  border: 2px solid #ccc;
  border-radius: 6px;
  text-align: center;
  font-size: 1.4rem;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: 0.2s;
  margin: 0 4px;
}
.math-blank:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
</style>
