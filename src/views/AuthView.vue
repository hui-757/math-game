<template>
  <div class="auth-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回</button>
      <h2>{{ isLogin ? '登录' : '注册' }}</h2>
      <span></span>
    </div>

    <!-- 登录/注册切换 -->
    <div class="mode-tabs">
      <button :class="{ active: isLogin }" @click="isLogin = true">登录</button>
      <button :class="{ active: !isLogin }" @click="isLogin = false">注册</button>
    </div>

    <!-- 身份选择 -->
    <div class="role-tabs">
      <button :class="{ active: role === 'student' }" @click="role = 'student'">学生</button>
      <button :class="{ active: role === 'teacher' }" @click="role = 'teacher'">教师</button>
    </div>

    <!-- 表单 -->
    <div class="form">
      <input v-if="!isLogin" type="text" v-model="name" placeholder="姓名" />
      <input type="text" v-model="number" :placeholder="role === 'student' ? '学号' : '工号'" />
      <input type="text" v-model="school" placeholder="学校" />

      <button class="btn btn-primary" @click="submit" :disabled="!canSubmit">
        {{ isLogin ? '登录' : (role === 'teacher' ? '提交申请' : '注册') }}
      </button>
      <p class="error" v-if="error">{{ error }}</p>
    </div>

    <!-- 成功提示 -->
    <div class="success" v-if="successMsg">
      <p>{{ successMsg }}</p>
      <p v-if="role === 'teacher' && !isLogin" class="tip">管理员审核通过后，你将获得教师权限。</p>
      <button class="btn btn-primary" @click="goHome">{{ role === 'teacher' && !isLogin ? '知道了' : '去闯关' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useProgressStore } from '../stores/progress.js'
import { findUserByCredentials, createUser, submitTeacherApplication } from '../lib/api.js'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const isLogin = ref(true)
const role = ref('student')
const name = ref('')
const number = ref('')
const school = ref('')
const error = ref('')
const successMsg = ref('')

const canSubmit = computed(() => {
  if (isLogin.value) return number.value.trim() && school.value.trim()
  return name.value.trim() && number.value.trim() && school.value.trim()
})

async function submit() {
  error.value = ''
  successMsg.value = ''

  const num = number.value.trim()
  const sch = school.value.trim()
  const nm = name.value.trim()

  try {
    const existing = await findUserByCredentials(num, sch)

    if (isLogin.value) {
      // 登录模式
      if (!existing) {
        error.value = '账号不存在，请检查学号/工号和学校，或先注册'
        return
      }

      if (existing.role === 'teacher_pending') {
        error.value = '你的教师申请正在审核中，请耐心等待'
        return
      }

      authStore.setUser({
        id: existing.id,
        nickname: existing.nickname,
        student_number: existing.student_number,
        school: existing.school,
        role: existing.role,
        class_id: existing.class_id
      })

      if (existing.role === 'student') {
        await syncProgress(existing.id)
        // 学生未加入班级时，询问是否认证
        if (!existing.class_id) {
          router.push('/verify')
          return
        }
      }

      successMsg.value = `欢迎回来，${existing.nickname}！`
      return
    }

    // 注册模式
    if (existing) {
      error.value = '该学号/工号在此学校已注册，请直接登录'
      return
    }

    const newRole = role.value === 'teacher' ? 'teacher_pending' : 'student'
    const newUser = await createUser({
      nickname: nm,
      studentNumber: num,
      school: sch,
      role: newRole
    })

    authStore.setUser({
      id: newUser.id,
      nickname: newUser.nickname,
      student_number: newUser.student_number,
      school: newUser.school,
      role: newUser.role,
      class_id: newUser.class_id
    })

    if (role.value === 'teacher') {
      await submitTeacherApplication({ studentId: newUser.id, school: sch })
      successMsg.value = '教师申请已提交！'
    } else {
      await syncProgress(newUser.id)
      successMsg.value = '注册成功！'
      router.push('/verify')
      return
    }
  } catch (e) {
    error.value = '操作失败：' + (e.message || '未知错误')
  }
}

async function syncProgress(studentId) {
  const localRecords = progressStore.records
  if (localRecords.length === 0) return
  for (const r of localRecords) {
    try {
      await import('../lib/api.js').then(m => m.submitProgress({
        student_id: studentId,
        level_id: r.level_id,
        correct_count: r.correct_count,
        total_count: r.total_count,
        time_seconds: r.time_seconds,
        mistakes: r.mistakes
      }))
    } catch (e) { /* 静默失败 */ }
  }
}

function goHome() {
  router.push('/select')
}
</script>

<style scoped>
.auth-page {
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

.mode-tabs, .role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.mode-tabs button, .role-tabs button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 14px;
}
.mode-tabs button.active, .role-tabs button.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.form {
  text-align: center;
}
input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
}
.btn {
  padding: 10px 20px;
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
  width: 100%;
  padding: 12px;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.error {
  color: #ff4d4f;
  margin-top: 12px;
}

.success {
  text-align: center;
  padding: 40px 20px;
}
.success p {
  font-size: 18px;
  margin-bottom: 8px;
}
.success .tip {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
