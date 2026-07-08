<template>
  <div class="profile-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回首页</button>
      <h2>个人中心</h2>
      <span></span>
    </div>

    <!-- 未加入班级 -->
    <div class="guest-area" v-if="!authStore.isStudent">
      <p>你当前是访客模式，闯关进度只保存在本机。</p>
      <button class="btn btn-primary" @click="$router.push('/join')">登录 / 加入班级</button>
      <p class="tip">登录后可同步进度到班级，换设备不丢失。</p>
      <div class="records" v-if="records.length > 0">
        <h3>本地记录</h3>
        <div class="record-item" v-for="(r, i) in records.slice(0, 10)" :key="i">
          <span>{{ formatLevelName(r.level_id) }}</span>
          <span>{{ r.correct_count }}/{{ r.total_count }}</span>
        </div>
      </div>
    </div>

    <!-- 已加入班级 -->
    <div class="member-area" v-else>
      <div class="info">
        <span>{{ authStore.student.nickname }} ({{ authStore.student.student_number }})</span>
        <button class="btn btn-small" @click="logout">退出</button>
      </div>

      <div class="stat-row">
        <div class="stat-box">已闯关: {{ totalLevels }}</div>
        <div class="stat-box">正确率: {{ avgScore }}%</div>
        <div class="stat-box">总用时: {{ totalTime }}分</div>
      </div>

      <div class="records">
        <h3>最近记录</h3>
        <div v-if="records.length === 0">暂无记录</div>
        <div class="record-item" v-for="(r, i) in records.slice(0, 10)" :key="i">
          <span>{{ formatLevelName(r.level_id) }}</span>
          <span>{{ r.correct_count }}/{{ r.total_count }}</span>
          <span>{{ formatDate(r.timestamp) }}</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" @click="$router.push('/select')">去闯关</button>
        <button class="btn" @click="clearLocal">清空本地记录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useProgressStore } from '../stores/progress.js'

const authStore = useAuthStore()
const progressStore = useProgressStore()

authStore.loadFromStorage()
progressStore.loadFromStorage()

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

function logout() {
  authStore.logout()
  progressStore.records = []
  localStorage.removeItem('progress_records')
}

function clearLocal() {
  if (confirm('确定清空所有本地记录？')) {
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
.profile-page {
  padding: 16px;
  max-width: 480px;
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
.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.guest-area {
  text-align: center;
  padding: 40px 20px;
}
.guest-area p {
  color: #666;
  margin-bottom: 20px;
}

.info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 12px;
}
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.stat-box {
  text-align: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
}

.records {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.records h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.record-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}
.record-item:last-child {
  border-bottom: none;
}

.actions {
  display: flex;
  gap: 12px;
}
</style>
