<template>
  <div class="teacher-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回首页</button>
      <h2>班级管理</h2>
      <span></span>
    </div>

    <!-- 教师未登录 -->
    <div class="not-auth" v-if="!authStore.isLoggedIn">
      <p>请先登录</p>
      <button class="btn btn-primary" @click="$router.push('/auth')">登录</button>
    </div>

    <!-- 教师已登录 -->
    <template v-else>
      <!-- 班级列表 -->
      <div class="class-list-section" v-if="!classInfo">
        <h3>我的班级</h3>
        <div v-if="myClasses.length === 0" class="empty">
          <p>你还没有创建班级</p>
        </div>
        <div v-else class="class-cards">
          <div class="class-card" v-for="cls in myClasses" :key="cls.id" @click="viewClass(cls.code)">
            <div class="class-name">{{ cls.name }}</div>
            <div class="class-code">班级码：{{ cls.code }}</div>
            <div class="class-date">创建于 {{ formatDate(cls.created_at) }}</div>
          </div>
        </div>

        <!-- 创建新班级 -->
        <div class="create-section">
          <h4>创建新班级</h4>
          <input type="text" v-model="className" placeholder="班级名称（如 三（1）班）" />
          <button class="btn btn-primary" @click="create" :disabled="!className.trim()">创建</button>
          <div v-if="created" class="created-info">
            <p><strong>班级码：</strong>{{ createdClass.code }}</p>
            <p><strong>班级名称：</strong>{{ createdClass.name }}</p>
            <p class="tip">请把班级码发给学生，学生凭班级码加入。</p>
            <button class="btn" @click="viewClass(createdClass.code)">查看班级统计</button>
          </div>
        </div>
      </div>

      <!-- 已选中班级详情 -->
      <div class="dashboard" v-else>
        <div class="class-header">
          <h3>{{ classInfo.name }}</h3>
          <span>班级码：{{ classInfo.code }}</span>
          <button class="btn btn-small" @click="classInfo = null">返回列表</button>
        </div>

        <div class="stats">
          <div class="stat-box">学生数：{{ stats.totalStudents }}</div>
          <div class="stat-box">平均正确率：{{ stats.avgAccuracy }}%</div>
        </div>

        <div class="student-list" v-if="students.length > 0">
          <h4>学生列表</h4>
          <table>
            <thead>
              <tr><th>学号</th><th>姓名</th><th>已闯关</th><th>正确率</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in students" :key="s.id">
                <td>{{ s.student_number }}</td>
                <td>{{ s.nickname }}</td>
                <td>{{ s.completedLevels }}</td>
                <td>{{ s.accuracy }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">暂无学生加入</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { createClass, findClassByCode, fetchClassStudents, fetchMyClasses } from '../lib/api.js'

const authStore = useAuthStore()
authStore.loadFromStorage()

const myClasses = ref([])
const className = ref('')
const created = ref(false)
const createdClass = ref(null)
const classInfo = ref(null)
const students = ref([])
const stats = ref({ totalStudents: 0, avgAccuracy: 0 })

onMounted(async () => {
  if (authStore.isLoggedIn && (authStore.isTeacher || authStore.isAdmin)) {
    await loadMyClasses()
  }
})

async function loadMyClasses() {
  try {
    myClasses.value = await fetchMyClasses(authStore.user.id)
  } catch (e) {
    console.error('加载班级列表失败', e)
  }
}

async function create() {
  if (!authStore.isTeacher && !authStore.isAdmin) {
    alert('只有教师可以创建班级')
    return
  }
  try {
    const cls = await createClass(className.value.trim(), authStore.user.id)
    createdClass.value = cls
    created.value = true
    await loadMyClasses() // 刷新列表
  } catch (e) {
    alert('创建失败：' + (e.message || '未知错误'))
  }
}

async function viewClass(code) {
  try {
    const cls = await findClassByCode(code.toUpperCase())
    if (!cls) {
      alert('班级码不存在')
      return
    }
    classInfo.value = cls
    const list = await fetchClassStudents(cls.id)
    students.value = list
    stats.value = {
      totalStudents: list.length,
      avgAccuracy: list.length
        ? Math.round(list.reduce((s, st) => s + st.accuracy, 0) / list.length)
        : 0
    }
  } catch (e) {
    alert('查询失败：' + (e.message || '未知错误'))
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.teacher-page {
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
.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.not-auth {
  text-align: center;
  padding: 40px;
}

.class-list-section h3 {
  margin-bottom: 12px;
}

.class-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.class-card {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
}
.class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.class-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}
.class-code {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 4px;
}
.class-date {
  font-size: 12px;
  color: #999;
}

.create-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.create-section h4 {
  margin-bottom: 12px;
}
.create-section input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
}
.created-info {
  margin-top: 16px;
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #52c41a;
  border-radius: 8px;
}
.created-info p {
  margin: 8px 0;
  font-size: 16px;
}
.created-info .tip {
  color: #666;
  font-size: 14px;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #999;
}

.class-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}
.class-header h3 {
  margin: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.stat-box {
  text-align: center;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 16px;
}

.student-list h4 {
  margin: 0 0 12px;
}
.student-list table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.student-list th, .student-list td {
  border: 1px solid #eee;
  padding: 8px;
  text-align: center;
}
.student-list th {
  background: #f5f5f5;
}
</style>
