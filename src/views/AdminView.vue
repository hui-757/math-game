<template>
  <div class="admin-page">
    <!-- 权限检查 -->
    <div v-if="!authStore.isAdmin" class="no-access">
      <h2>⛔ 无权访问</h2>
      <p>只有管理员可以查看此页面。</p>
      <button class="btn btn-primary" @click="$router.push('/select')">返回首页</button>
    </div>

    <template v-else>
      <div class="header">
        <button class="btn" @click="$router.push('/select')">返回首页</button>
        <h2>管理员后台</h2>
        <span></span>
      </div>

      <!-- 平台数据 -->
      <div class="stats-section">
        <h3>📊 平台数据</h3>
        <div class="stats-grid">
          <div class="stat-card">学生数<br><strong>{{ stats.totalStudents }}</strong></div>
          <div class="stat-card">教师数<br><strong>{{ stats.totalTeachers }}</strong></div>
          <div class="stat-card">班级数<br><strong>{{ stats.totalClasses }}</strong></div>
          <div class="stat-card">闯关记录<br><strong>{{ stats.totalProgress }}</strong></div>
          <div class="stat-card">待审申请<br><strong>{{ stats.pendingApplications }}</strong></div>
        </div>
      </div>

      <!-- 教师申请列表 -->
      <div class="applications-section">
        <h3>📝 教师申请</h3>
        <div v-if="applications.length === 0" class="empty">暂无申请</div>
        <div v-else class="app-list">
          <div class="app-item" v-for="app in applications" :key="app.id">
            <div class="app-info">
              <span class="name">{{ app.students?.nickname || '未知' }}</span>
              <span class="school">{{ app.school }}</span>
              <span class="number">学号/工号：{{ app.students?.student_number || '-' }}</span>
              <span class="time">{{ formatDate(app.created_at) }}</span>
            </div>
            <div class="app-status">
              <span :class="['badge', app.status]">{{ statusText(app.status) }}</span>
              <div class="actions" v-if="app.status === 'pending'">
                <button class="btn btn-approve" @click="resolve(app.id, 'approved')">通过</button>
                <button class="btn btn-reject" @click="resolve(app.id, 'rejected')">拒绝</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { fetchPlatformStats, fetchTeacherApplications, resolveTeacherApplication } from '../lib/api.js'

const authStore = useAuthStore()
authStore.loadFromStorage()

const stats = ref({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalProgress: 0, pendingApplications: 0 })
const applications = ref([])

onMounted(async () => {
  await loadStats()
  await loadApplications()
})

async function loadStats() {
  try {
    stats.value = await fetchPlatformStats()
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

async function loadApplications() {
  try {
    applications.value = await fetchTeacherApplications()
  } catch (e) {
    console.error('加载申请列表失败', e)
  }
}

async function resolve(id, status) {
  try {
    await resolveTeacherApplication(id, status, authStore.user.id)
    await loadApplications()
    await loadStats()
  } catch (e) {
    alert('操作失败：' + (e.message || '未知错误'))
  }
}

function statusText(status) {
  return { pending: '待审核', approved: '已通过', rejected: '已拒绝' }[status] || status
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.admin-page {
  padding: 16px;
  max-width: 800px;
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

.stats-section, .applications-section {
  margin-bottom: 24px;
}
.stats-section h3, .applications-section h3 {
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.stat-card {
  text-align: center;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
}
.stat-card strong {
  font-size: 24px;
  color: #409eff;
}

.app-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.app-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}
.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.app-info .name {
  font-weight: bold;
}
.app-info .school, .app-info .number, .app-info .time {
  font-size: 13px;
  color: #666;
}
.app-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.badge.pending { background: #fff7e6; color: #fa8c16; }
.badge.approved { background: #f6ffed; color: #52c41a; }
.badge.rejected { background: #fff1f0; color: #ff4d4f; }

.actions {
  display: flex;
  gap: 8px;
}
.btn-approve {
  background: #52c41a;
  color: white;
  border-color: #52c41a;
}
.btn-reject {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
