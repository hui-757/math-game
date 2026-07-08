<template>
  <div class="unit-page">
    <div class="header">
      <button class="btn" @click="$router.push(`/semester/${grade}`)">返回</button>
      <h2>{{ grade }}年级{{ semester === 1 ? '上' : '下' }}册</h2>
      <span></span>
    </div>

    <div class="loading" v-if="loading">加载中...</div>
    <div class="error" v-else-if="error">{{ error }}</div>

    <div class="unit-list" v-else>
      <div
        v-for="u in units"
        :key="u.unit"
        class="unit-card"
      >
        <div class="unit-header">
          <span class="unit-num">第{{ u.unit }}单元</span>
          <span class="unit-status" :class="getStatusClass(u.unit)">
            {{ getStatusText(u.unit) }}
          </span>
        </div>
        <div class="unit-name">{{ u.name }}</div>
        <div class="unit-topic">
          <strong>计算内容：</strong>{{ u.topic }}
        </div>
        <div class="unit-examples">
          <strong>示例：</strong>
          <span v-for="(ex, i) in u.examples" :key="i" class="example">{{ ex }}</span>
        </div>
        <button
          class="btn btn-primary play-btn"
          @click="play(u.unit)"
          :disabled="!hasQuestions(u.unit)"
        >
          {{ hasQuestions(u.unit) ? '开始闯关' : '题目筹备中' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUnits } from '../data/curriculum.js'
import { fetchQuestions } from '../lib/api.js'
import { useProgressStore } from '../stores/progress.js'

const props = defineProps(['grade', 'semester'])
const router = useRouter()
const progressStore = useProgressStore()

const loading = ref(true)
const error = ref('')
const questionUnits = ref(new Set()) // 数据库里有题目的 unit 集合

const units = computed(() => getUnits(Number(props.grade), Number(props.semester)))

onMounted(async () => {
  try {
    progressStore.loadFromStorage()
    const all = await fetchQuestions(Number(props.grade), Number(props.semester))
    // 收集哪些 unit 有题目
    all.forEach(q => questionUnits.value.add(q.unit))
    loading.value = false
  } catch (e) {
    error.value = '加载失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})

function hasQuestions(unit) {
  return questionUnits.value.has(unit)
}

function getLevelId(unit) {
  // 目前每个 unit 只有一个 level=1
  return `${props.grade}-${props.semester}-${unit}-1`
}

function getStatusText(unit) {
  const levelId = getLevelId(unit)
  if (!hasQuestions(unit)) return '暂无题目'
  if (progressStore.isLevelCompleted(levelId)) return '已完成'
  return '可闯关'
}

function getStatusClass(unit) {
  const levelId = getLevelId(unit)
  if (!hasQuestions(unit)) return 'none'
  if (progressStore.isLevelCompleted(levelId)) return 'completed'
  return 'unlocked'
}

function play(unit) {
  if (!hasQuestions(unit)) return
  router.push(`/map/${props.grade}/${props.semester}/${unit}`)
}
</script>

<style scoped>
.unit-page {
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
  padding: 6px 12px;
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
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.unit-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.unit-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  background: white;
}
.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.unit-num {
  font-size: 14px;
  color: #999;
}
.unit-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.unit-status.completed {
  background: #f6ffed;
  color: #52c41a;
}
.unit-status.unlocked {
  background: #e6f7ff;
  color: #1890ff;
}
.unit-status.none {
  background: #f5f5f5;
  color: #999;
}
.unit-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.unit-topic {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
}
.unit-examples {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}
.example {
  display: inline-block;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  margin-right: 8px;
  margin-bottom: 4px;
}
.play-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}
</style>
