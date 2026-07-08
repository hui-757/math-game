<template>
  <div class="select-page">
    <h1>小学数学闯关游戏</h1>
    <p class="subtitle">选择年级</p>

    <div class="grade-grid">
      <div
        v-for="grade in 6"
        :key="grade"
        class="grade-card"
        @click="selectGrade(grade)"
      >
        <div class="grade-num">{{ grade }}</div>
        <div class="grade-text">年级</div>
      </div>
    </div>

    <div class="bottom-actions">
      <button class="btn" @click="$router.push('/profile')">个人中心</button>
      <template v-if="authStore.isLoggedIn">
        <span class="user-name">👋 {{ authStore.user.nickname }}</span>
        <span class="role-badge" v-if="authStore.isAdmin">管理员</span>
        <span class="role-badge teacher" v-else-if="authStore.isTeacher">教师</span>
      </template>
      <template v-else>
        <button class="btn" @click="$router.push('/auth')">注册 / 登录</button>
      </template>
      <button class="btn" v-if="authStore.isAdmin" @click="$router.push('/admin')">管理后台</button>
      <button class="btn" v-else-if="authStore.isTeacher" @click="$router.push('/teacher')">教师中心</button>
      <button class="btn" v-else @click="$router.push('/teacher')">教师登录</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
authStore.loadFromStorage()

function selectGrade(grade) {
  router.push(`/semester/${grade}`)
}
</script>

<style scoped>
.select-page {
  padding: 40px 20px;
  text-align: center;
  min-height: 100vh;
}
h1 {
  margin-bottom: 8px;
  color: #333;
  font-size: 28px;
}
.subtitle {
  color: #666;
  margin-bottom: 30px;
}
.grade-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 360px;
  margin: 0 auto;
}
.grade-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
}
.grade-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.grade-num {
  font-size: 36px;
  font-weight: bold;
  color: #333;
}
.grade-text {
  font-size: 14px;
  color: #666;
}
.bottom-actions {
  margin-top: 40px;
}
.btn {
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 14px;
}
.student-name {
  padding: 10px 20px;
  color: #409eff;
  font-size: 14px;
  font-weight: bold;
}
.user-name {
  padding: 10px 16px;
  color: #409eff;
  font-size: 14px;
  font-weight: bold;
}
.role-badge {
  padding: 4px 8px;
  background: #ff4d4f;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}
.role-badge.teacher {
  background: #52c41a;
}
</style>
