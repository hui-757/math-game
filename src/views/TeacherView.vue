<template>
  <div class="teacher-page">
    <div class="teacher-header">
      <button class="btn-back" @click="$router.push('/')">← 返回首页</button>
      <h2>👨‍🏫 教师中心</h2>
      <div class="spacer"></div>
    </div>

    <!-- 登录区 -->
    <div class="login-area" v-if="!authStore.student">
      <div class="login-card">
        <h3>学生登录</h3>
        <input
          type="text"
          class="login-input"
          placeholder="输入学号"
          v-model="studentId"
          @keyup.enter="login"
        />
        <input
          type="text"
          class="login-input"
          placeholder="输入姓名"
          v-model="studentName"
          @keyup.enter="login"
        />
        <button class="btn btn-primary" @click="login" :disabled="!studentId || !studentName">
          登录
        </button>
      </div>
      <p class="tip">💡 不登录也可以使用，进度保存在本地</p>
    </div>

    <!-- 已登录 -->
    <div class="dashboard" v-else>
      <div class="student-info">
        <div class="avatar">🧑‍🎓</div>
        <div>
          <div class="name">{{ authStore.student.name }}</div>
          <div class="id">学号: {{ authStore.student.id }}</div>
        </div>
        <button class="btn btn-small" @click="logout">退出</button>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-num">{{ totalLevels }}</div>
          <div class="stat-desc">已闯关</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">{{ avgScore }}%</div>
          <div class="stat-desc">平均正确率</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">{{ totalTime }}分</div>
          <div class="stat-desc">总用时</div>
        </div>
      </div>

      <!-- 最近记录 -->
      <div class="records">
        <h3>📋 最近闯关记录</h3>
        <div v-if="records.length === 0" class="empty-records">
          暂无记录，快去闯关吧！
        </div>
        <div class="record-list" v-else>
          <div class="record-item" v-for="(r, i) in records.slice(0, 10)" :key="i">
            <div class="record-level">{{ formatLevelName(r.level_id) }}</div>
            <div class="record-score" :class="r.correct_count === r.total_count ? 'perfect' : r.correct_count >= r.total_count * 0.6 ? 'pass' : 'fail'">
              {{ r.correct_count }}/{{ r.total_count }}
            </div>
            <div class="record-time">{{ formatDate(r.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 操作 -->
      <div class="actions">
        <button class="btn btn-primary" @click="$router.push('/')">🎮 去闯关</button>
        <button class="btn btn-secondary" @click="clearLocal">🗑️ 清空本地记录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useProgressStore } from '../stores/progress.js'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const studentId = ref('')
const studentName = ref('')

onMounted(() => {
  authStore.loadFromStorage()
  progressStore.loadFromStorage()
})

const records = computed(() => {
  return [...progressStore.records].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
})

const totalLevels = computed(() => new Set(records.value.map(r => r.level_id)).size)
const avgScore = computed(() => {
  if (records.value.length === 0) return 0
  const total = records.value.reduce((s, r) => s + (r.correct_count / r.total_count), 0)
  return Math.round((total / records.value.length) * 100)
})
const totalTime = computed(() => {
  const s = records.value.reduce((s, r) => s + (r.time_seconds || 0), 0)
  return Math.round(s / 60)
})

function login() {
  if (!studentId.value.trim() || !studentName.value.trim()) return
  authStore.setStudent({ id: studentId.value.trim(), name: studentName.value.trim() })
  // 尝试同步远程进度
  progressStore.load(authStore.student.id).catch(() => {})
}
function logout() {
  authStore.logout()
}
function clearLocal() {
  if (confirm('确定要清空所有本地记录吗？此操作不可恢复！')) {
    progressStore.records = []
    localStorage.removeItem('progress_records')
  }
}
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
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.teacher-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
}
.teacher-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.teacher-header h2 {
  margin: 0;
  color: white;
  font-size: 20px;
}
.btn-back {
  background: rgba(255,255,255,0.2);
  border: 2px solid white;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.spacer { width: 80px; }

.login-area {
  max-width: 360px;
  margin: 0 auto;
}
.login-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
}
.login-card h3 {
  margin: 0 0 20px;
  color: #333;
}
.login-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 12px;
  box-sizing: border-box;
  outline: none;
}
.login-input:focus {
  border-color: #409eff;
}
.tip {
  color: rgba(255,255,255,0.8);
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.dashboard {
  max-width: 480px;
  margin: 0 auto;
}
.student-info {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.avatar {
  font-size: 40px;
  width: 56px; height: 56px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.id {
  font-size: 14px;
  color: #999;
}
.btn-small {
  margin-left: auto;
  padding: 6px 12px;
  font-size: 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}
.stat-desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.records {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.records h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}
.empty-records {
  text-align: center;
  color: #999;
  padding: 20px;
}
.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
}
.record-level {
  flex: 1;
  color: #333;
}
.record-score {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
}
.record-score.perfect { color: #52c41a; background: #f6ffed; }
.record-score.pass { color: #faad14; background: #fffbe6; }
.record-score.fail { color: #ff4d4f; background: #fff1f0; }
.record-time {
  color: #999;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 12px;
}
.btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:hover { opacity: 0.9; }
.btn-primary {
  background: #409eff;
  color: white;
}
.btn-secondary {
  background: #f0f0f0;
  color: #666;
}
</style>
