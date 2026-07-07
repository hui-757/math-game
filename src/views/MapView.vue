<template>
  <div class="map-page">
    <div class="map-header">
      <el-button @click="$router.push('/')" type="primary" plain>← 返回</el-button>
      <h2>{{ grade }}年级{{ semester === 1 ? '上' : '下' }}册</h2>
    </div>
    
    <div class="loading" v-if="loading">
      <el-icon><Loading /></el-icon> 加载关卡中...
    </div>
    
    <div class="error" v-else-if="error">
      <el-icon><Warning /></el-icon> {{ error }}
      <el-button @click="$router.push('/')" style="margin-top: 16px">返回首页</el-button>
    </div>
    
    <div class="map-container" v-else-if="levels.length > 0">
      <svg class="map-svg" viewBox="0 0 800 600">
        <path class="route-line" d="M100,500 Q200,400 300,450 T500,300 T700,100" fill="none" stroke="#ddd" stroke-width="4" stroke-dasharray="8,4"/>
        <g v-for="(level, i) in levels" :key="level.id">
          <LevelNode
            :x="getNodeX(i)"
            :y="getNodeY(i)"
            :status="getNodeStatus(level)"
            :label="level.name"
            @click="goToLevel(level)"
          />
        </g>
      </svg>
    </div>
    
    <div class="empty" v-else>
      该年级暂无题目
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress.js'
import { useAuthStore } from '../stores/auth.js'
import { fetchQuestions } from '../lib/api.js'
import LevelNode from '../components/LevelNode.vue'

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
    // 无论是否登录，都从 localStorage 加载进度
    progressStore.loadFromStorage()
    // 如果已登录，同时从数据库加载（覆盖本地数据）
    if (authStore.student) {
      await progressStore.load(authStore.student.id)
    }
    const all = await fetchQuestions(Number(props.grade), Number(props.semester))
    console.log('MapView fetched', all.length, 'questions for grade', props.grade, 'semester', props.semester)
    
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
    console.error('MapView error:', e)
    error.value = '加载失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})

function getNodeX(i) {
  const positions = [100, 250, 400, 550, 700, 350, 500, 650]
  return positions[i] || 100 + i * 80
}
function getNodeY(i) {
  const positions = [500, 420, 350, 220, 100, 180, 280, 400]
  return positions[i] || 500 - i * 50
}

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
.map-page { padding: 20px; }
.map-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.map-container { background: white; border-radius: 16px; overflow: hidden; }
.map-svg { width: 100%; height: 500px; }
.loading, .error, .empty { text-align: center; padding: 60px 20px; color: #999; }
.error { color: #f56c6c; }
</style>
