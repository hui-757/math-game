<template>
  <div class="teacher-page">
    <div class="teacher-login" v-if="!isLoggedIn">
      <h2>教师登录</h2>
      <el-input v-model="classCode" placeholder="输入班级码" />
      <el-input v-model="pin" placeholder="输入教师PIN" type="password" style="margin-top: 12px" />
      <el-button type="primary" @click="login" style="margin-top: 16px">进入</el-button>
    </div>
    <div class="teacher-dashboard" v-else>
      <h2>{{ stats.className }} 数据看板</h2>
      <div class="stats-cards">
        <el-card>
          <div class="stat-value">{{ stats.totalStudents }}</div>
          <div class="stat-label">总人数</div>
        </el-card>
        <el-card>
          <div class="stat-value">{{ stats.activeToday }}</div>
          <div class="stat-label">今日活跃</div>
        </el-card>
        <el-card>
          <div class="stat-value">{{ Math.round(stats.avgAccuracy * 100) }}%</div>
          <div class="stat-label">平均正确率</div>
        </el-card>
      </div>
      <h3 style="margin-top: 30px">学生明细</h3>
      <el-table :data="stats.studentList" style="margin-top: 16px">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="completedLevels" label="完成关卡" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { findClassByCode, fetchClassStats } from '../lib/api.js'

const classCode = ref('')
const pin = ref('')
const isLoggedIn = ref(false)
const stats = ref({})

async function login() {
  const cls = await findClassByCode(classCode.value)
  if (!cls) { alert('班级码不存在'); return }
  if (cls.teacher_pin !== pin.value) { alert('PIN码错误'); return }
  isLoggedIn.value = true
  stats.value = await fetchClassStats(cls.id)
}
</script>

<style scoped>
.teacher-page { padding: 40px 20px; max-width: 800px; margin: 0 auto; }
.teacher-login { text-align: center; max-width: 300px; margin: 60px auto; }
.teacher-login h2 { margin-bottom: 20px; }
.stats-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
.stat-value { font-size: 36px; font-weight: bold; color: #409eff; text-align: center; }
.stat-label { text-align: center; color: #666; margin-top: 8px; }
</style>
