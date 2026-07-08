<template>
  <div class="map-page">
    <div class="map-header">
      <button class="btn-back" @click="$router.push('/')">← 返回</button>
      <h2>{{ grade }}年级{{ semester === 1 ? '上' : '下' }}册</h2>
      <div class="placeholder-avatar">🧑‍🎓</div>
    </div>
    
    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>加载关卡中...</p>
    </div>
    
    <div class="error" v-else-if="error">
      <p>⚠️ {{ error }}</p>
      <button class="btn btn-primary" @click="$router.push('/')">返回首页</button>
    </div>
    
    <div class="map-road" v-else-if="levels.length > 0">
      <!-- 路线 -->
      <div class="road-line"></div>
      
      <!-- 关卡点 -->
      <div
        v-for="(level, i) in levels"
        :key="level.id"
        class="level-node"
        :class="getNodeStatus(level)"
        :style="getNodeStyle(i)"
        @click="goToLevel(level)"
      >
        <div class="node-circle">
          <span v-if="getNodeStatus(level) === 'completed'">⭐</span>
          <span v-else-if="getNodeStatus(level) === 'unlocked'">▶️</span>
          <span v-else>🔒</span>
        </div>
        <div class="node-label">{{ level.name }}</div>
      </div>
    </div>
    
    <div class="empty" v-else>
      <p>📚 该年级暂无题目</p>
      <button class="btn btn-primary" @click="$router.push('/')">返回首页</button>
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

function getNodeStyle(i) {
  const positions = [
    { left: '10%', top: '80%' },
    { left: '30%', top: '60%' },
    { left: '50%', top: '70%' },
    { left: '70%', top: '40%' },
    { left: '85%', top: '20%' },
    { left: '55%', top: '30%' },
    { left: '35%', top: '45%' },
    { left: '60%', top: '55%' }
  ]
  return positions[i] || { left: '50%', top: '50%' }
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
.map-page {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #90EE90 100%);
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
.btn-back {
  background: rgba(255,255,255,0.8);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.placeholder-avatar {
  font-size: 32px;
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-road {
  position: relative;
  width: 100%;
  height: 500px;
  background: rgba(255,255,255,0.3);
  border-radius: 20px;
  overflow: hidden;
}
.road-line {
  position: absolute;
  left: 10%;
  top: 80%;
  width: 2px;
  height: 2px;
  /* 占位符：后续可替换为SVG路线 */
}

.level-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}
.level-node:hover { transform: scale(1.1); }
.level-node.locked { opacity: 0.5; cursor: not-allowed; }

.node-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 4px solid;
}
.level-node.completed .node-circle {
  background: #52c41a;
  border-color: #389e0d;
}
.level-node.unlocked .node-circle {
  background: #faad14;
  border-color: #d48806;
  animation: pulse 1.5s infinite;
}
.level-node.locked .node-circle {
  background: #d9d9d9;
  border-color: #bfbfbf;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.node-label {
  margin-top: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  background: rgba(255,255,255,0.8);
  padding: 2px 8px;
  border-radius: 4px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 60px 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ddd;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 16px;
}
.btn-primary {
  background: #409eff;
  color: white;
}
</style>
