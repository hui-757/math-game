<template>
  <div class="play-page">
    <div class="play-header">
      <button class="btn btn-small" @click="quit">返回</button>
      <span>{{ currentIndex + 1 }} / {{ questions.length }}</span>
      <span>用时 {{ formatTime }}</span>
    </div>

    <div class="loading" v-if="loading">加载题目中...</div>
    <div class="error" v-else-if="error">
      {{ error }}
      <button class="btn" @click="quit">返回</button>
    </div>

    <div class="question-card" v-else-if="currentQuestion">
      <div class="q-lines">
        <div v-for="(line, li) in parsedContent.lines" :key="li" class="q-line">
          <template v-for="(part, pi) in line" :key="pi">
            <span v-if="part.type === 'text'">{{ part.text }}</span>
            <input
              v-else
              type="text"
              inputmode="numeric"
              class="blank-input"
              :value="allAnswers[currentIndex]?.[part.id] || ''"
              @input="updateAnswer(part.id, $event.target.value)"
              maxlength="8"
            />
          </template>
        </div>
      </div>

      <div class="actions">
        <button class="btn" @click="prev" v-if="currentIndex > 0">上一题</button>
        <button class="btn btn-primary" @click="next" v-if="currentIndex < questions.length - 1">下一题</button>
        <button class="btn btn-primary" @click="submitAll" v-else>提交闯关</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game.js'
import { useProgressStore } from '../stores/progress.js'
import { useAuthStore } from '../stores/auth.js'
import { fetchQuestions, submitProgress } from '../lib/api.js'

const props = defineProps(['levelId'])
const router = useRouter()
const gameStore = useGameStore()
const progressStore = useProgressStore()
const authStore = useAuthStore()

const questions = ref([])
const allAnswers = ref([])
const timer = ref(0)
const loading = ref(true)
const error = ref('')
let timerInterval = null
let startTime = 0

const currentIndex = ref(0)
const currentQuestion = computed(() => questions.value[currentIndex.value])

const parsedContent = computed(() => {
  const q = currentQuestion.value
  if (!q || !q.content) return { lines: [] }
  if (typeof q.content === 'string') {
    try { return JSON.parse(q.content) } catch { return { lines: [[{type:'text', text: q.content}]] } }
  }
  return q.content
})

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

    startTime = Date.now()
    loading.value = false
    timerInterval = setInterval(() => { timer.value++ }, 1000)
  } catch (e) {
    error.value = '加载失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function updateAnswer(id, value) {
  if (!allAnswers.value[currentIndex.value]) allAnswers.value[currentIndex.value] = {}
  allAnswers.value[currentIndex.value][id] = value
}

function prev() {
  if (currentIndex.value > 0) currentIndex.value--
}
function next() {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}
function quit() {
  if (confirm('确定要退出吗？进度将不会保存。')) {
    if (timerInterval) clearInterval(timerInterval)
    const [grade, semester] = props.levelId.split('-')
    router.push(`/unit/${grade}/${semester}`)
  }
}

async function submitAll() {
  if (timerInterval) clearInterval(timerInterval)

  const total = questions.value.length
  let correct = 0
  const mistakes = []
  const userAnswers = {} // 格式: { "0_b1": "5", "1_b2": "3" }

  questions.value.forEach((q, i) => {
    const content = typeof q.content === 'string' ? JSON.parse(q.content) : q.content
    let qCorrect = true
    // 构建完整的题目文本
    const questionText = content.lines?.map(line =>
      line.map(p => p.type === 'text' ? p.text : '___').join('')
    ).join(' ')

    content.lines?.forEach(line => {
      line.forEach(part => {
        if (part.type === 'blank') {
          const ans = (allAnswers.value[i]?.[part.id] || '').trim()
          const ok = ans === String(part.answer)
          userAnswers[`${i}_${part.id}`] = ans || '(未答)'
          if (!ok) {
            qCorrect = false
            mistakes.push({
              question_id: q.id,
              question_text: questionText || '题目',
              user_answer: ans || '(未答)',
              correct_answer: part.answer
            })
          }
        }
      })
    })
    if (qCorrect) correct++
  })

  const timeSeconds = Math.round((Date.now() - startTime) / 1000)

  const record = {
    level_id: props.levelId,
    correct_count: correct,
    total_count: total,
    time_seconds: timeSeconds,
    mistakes: mistakes, // 存储完整错题数组
    user_answers: userAnswers,
    timestamp: Date.now()
  }
  progressStore.addRecord(record)

  if (authStore.isLoggedIn) {
    try {
      await submitProgress({
        student_id: authStore.user.id,
        level_id: props.levelId,
        correct_count: correct,
        total_count: total,
        time_seconds: timeSeconds,
        mistakes: mistakes,
        user_answers: userAnswers
      })
    } catch (e) { console.warn('同步失败', e) }
  }

  gameStore.setResult({
    levelId: props.levelId,
    correct, total, time: timeSeconds, mistakes,
    score: total > 0 ? Math.round((correct / total) * 100) : 0
  })

  router.push({ name: 'result' })
}
</script>

<style scoped>
.play-page {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.play-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}
.question-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}
.q-lines {
  margin-bottom: 24px;
}
.q-line {
  font-size: 20px;
  line-height: 2.5;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.blank-input {
  width: 80px;
  padding: 6px 8px;
  font-size: 18px;
  text-align: center;
  border: 2px solid #ccc;
  border-radius: 4px;
  outline: none;
}
.blank-input:focus {
  border-color: #409eff;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn {
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}
.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}
.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
