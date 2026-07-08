<template>
  <div class="teacher-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回首页</button>
      <h2>教师中心</h2>
      <span></span>
    </div>

    <!-- 未进入班级 -->
    <div class="login-area" v-if="!classInfo">
      <div class="tabs">
        <button :class="{active: mode==='create'}" @click="mode='create'">创建班级</button>
        <button :class="{active: mode==='view'}" @click="mode='view'">查看统计</button>
      </div>

      <!-- 创建班级 -->
      <div v-if="mode==='create'">
        <input type="text" v-model="className" placeholder="班级名称（如 三（1）班）" />
        <button class="btn btn-primary" @click="create" :disabled="!className.trim()">创建</button>
        <div v-if="created" class="created-info">
          <p><strong>班级码：</strong>{{ createdClass.code }}</p>
          <p><strong>班级名称：</strong>{{ createdClass.name }}</p>
          <p class="tip">请把班级码发给学生，学生凭班级码加入。</p>
          <button class="btn" @click="viewClass(createdClass.code)">查看班级统计</button>
        </div>
      </div>

      <!-- 查看统计 -->
      <div v-if="mode==='view'">
        <input type="text" v-model="inputCode" placeholder="班级码（如 A3B7K9）" maxlength="6" />
        <button class="btn btn-primary" @click="viewClass(inputCode.trim())" :disabled="!inputCode.trim()">查看</button>
        <p class="error" v-if="error">{{ error }}</p>
      </div>
    </div>

    <!-- 已查看班级 -->
    <div class="dashboard" v-else>
      <div class="class-header">
        <h3>{{ classInfo.name }}</h3>
        <span>班级码：{{ classInfo.code }}</span>
        <button class="btn btn-small" @click="classInfo = null">退出</button>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createClass, findClassByCode, fetchClassStudents } from '../lib/api.js'

const mode = ref('create')
const className = ref('')
const created = ref(false)
const createdClass = ref(null)
const inputCode = ref('')
const error = ref('')
const classInfo = ref(null)
const students = ref([])
const stats = ref({ totalStudents: 0, avgAccuracy: 0 })

async function create() {
  try {
    const cls = await createClass(className.value.trim())
    createdClass.value = cls
    created.value = true
  } catch (e) {
    alert('创建失败：' + (e.message || '未知错误'))
  }
}

async function viewClass(code) {
  error.value = ''
  try {
    const cls = await findClassByCode(code.toUpperCase())
    if (!cls) {
      error.value = '班级码不存在'
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
    error.value = '查询失败：' + (e.message || '未知错误')
  }
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
}
.tabs button.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.login-area input {
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

.error {
  color: #ff4d4f;
  margin-top: 12px;
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

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
