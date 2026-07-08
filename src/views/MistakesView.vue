<template>
  <div class="mistakes-page">
    <div class="header">
      <button class="btn" @click="$router.push('/profile')">返回</button>
      <h2>错题本</h2>
      <span></span>
    </div>

    <div v-if="allMistakes.length === 0" class="empty">
      <p>🎉 太棒了！你还没有错题，继续保持！</p>
      <button class="btn btn-primary" @click="$router.push('/select')">去闯关</button>
    </div>

    <div v-else>
      <div class="summary">
        <span>共 {{ allMistakes.length }} 道错题</span>
        <span>来自 {{ uniqueLevels }} 个关卡</span>
      </div>

      <div class="mistake-list">
        <div class="mistake-card" v-for="(m, i) in allMistakes" :key="i">
          <div class="meta">
            <span class="level">{{ m.levelName }}</span>
            <span class="date">{{ m.date }}</span>
          </div>
          <div class="question">{{ m.question_text }}</div>
          <div class="answers">
            <span class="wrong">你的答案：{{ m.user_answer }}</span>
            <span class="correct">正确答案：{{ m.correct_answer }}</span>
          </div>
          <div class="actions">
            <button class="btn btn-primary" @click="retryLevel(m.level_id)">重做该关卡</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress.js'

const router = useRouter()
const progressStore = useProgressStore()
progressStore.loadFromStorage()

function formatLevelName(levelId) {
  const parts = levelId.split('-')
  if (parts.length >= 4) {
    return `${parts[0]}年级${parts[1] === '1' ? '上' : '下'}册 第${parts[2]}单元 第${parts[3]}关`
  }
  return levelId
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const allMistakes = computed(() => {
  const list = []
  progressStore.records.forEach(r => {
    const mistakes = Array.isArray(r.mistakes) ? r.mistakes : []
    mistakes.forEach(m => {
      list.push({
        ...m,
        level_id: r.level_id,
        levelName: formatLevelName(r.level_id),
        date: formatDate(r.timestamp)
      })
    })
  })
  // 按时间倒序
  return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
})

const uniqueLevels = computed(() => {
  return new Set(allMistakes.value.map(m => m.level_id)).size
})

function retryLevel(levelId) {
  router.push(`/play/${levelId}`)
}
</script>

<style scoped>
.mistakes-page {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header h2 {
  margin: 0;
  font-size: 20px;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.empty {
  text-align: center;
  padding: 60px 20px;
}
.empty p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.summary {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mistake-card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
}
.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}
.level {
  color: #409eff;
  font-weight: bold;
}
.date {
  color: #999;
}
.question {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}
.answers {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
}
.wrong {
  color: #ff4d4f;
}
.correct {
  color: #52c41a;
}
.actions {
  text-align: right;
}
</style>
