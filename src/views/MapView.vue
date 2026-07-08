<template>
  <div class="map-page">
    <div class="map-header">
      <button class="btn" @click="$router.push('/')">返回</button>
      <h2>{{ grade }}年级{{ semester === 1 ? '上' : '下' }}册</h2>
      <span></span>
    </div>
    
    <div class="loading" v-if="loading">加载关卡中...</div>
    
    <div class="error" v-else-if="error">
      {{ error }}
      <button class="btn" @click="$router.push('/')">返回首页</button>
    </div>
    
    <div class="level-list" v-else-if="levels.length > 0">
      <div
        v-for="level in levels"
        :key="level.id"
        class="level-item"
        :class="getNodeStatus(level)"
        @click="goToLevel(level)"
      >
        <span class="level-icon">
          {{ getNodeStatus(level) === 'completed' ? '★' : getNodeStatus(level) === 'unlocked' ? '>' : 'x' }}
        </span>
        <span class="level-name">{{ level.name }}</span>
      </div>
    </div>
    
    <div class="empty" v-else>
      <p>该年级暂无题目</p>
      <button class="btn" @click="$router.push('/')">返回首页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress.js'
import { useAuthStore } from '../stores/auth.js'
import { fetchQuestions } from '../lib/api.js'

const props = defineProps(['grade', 'semester'])
const router = useRouter()
const progressStore = useProgressStore()
const authStore = useAuthStore()

const levels = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    authStore.loadFromStorage()
    progressStore.loadFromStorage()
    if (authStore.student) {
      await progressStore.load(authStore.student.id)
    }
    const all = await fetchQuestions(Number(props.grade), Number(props.semester))
    
    const levelMap = new Map()
    all.forEach(q => {
      const key = `${q.unit}-${q.level}`
      if (!levelMap.has(key)) {
        levelMap.set(key, {
          id: `${props.grade}-${props.semester}-${q.unit}-${q.level}`,
          name: `第${levelMap.size + 1}关`,
          unit: q.unit,
          level: q.level,
          index: levelMap.size
        })
      }
    })
    levels.value = Array.from(levelMap.values()).sort((a, b) => a.index - b.index)
    loading.value = false
  } catch (e) {
    error.value = '加载失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})

function getNodeStatus(level) {
  if (progressStore.isLevelCompleted(level.id)) return 'completed'
  const prevLevel = levels.value[level.index - 1]
  if (!prevLevel) return 'unlocked'
  if (progressStore.isLevelCompleted(prevLevel.id)) return 'unlocked'
  return 'locked'
}

function goToLevel(level) {
  const status = getNodeStatus(level)
  if (status === 'locked') return
  router.push(`/play/${level.id}`)
}
</script>

<style scoped>
.map-page {
  padding: 20px;
  min-height: 100vh;
}
.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.map-header h2 {
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

.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}
.level-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  background: white;
}
.level-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
.level-item.completed {
  background: #f6ffed;
  border-color: #52c41a;
}
.level-item.unlocked {
  background: #fffbe6;
  border-color: #faad14;
}
.level-icon {
  font-size: 20px;
  width: 32px;
  text-align: center;
}
.level-name {
  font-size: 16px;
  font-weight: bold;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}
</style>
