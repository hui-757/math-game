<template>
  <div class="verify-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回首页</button>
      <h2>学生认证</h2>
      <span></span>
    </div>

    <div class="content">
      <p class="title">🎉 注册成功！</p>
      <p class="desc">你可以直接开始闯关，也可以加入班级让老师看到你的学习进度。</p>

      <div class="join-box" v-if="!joined">
        <input type="text" v-model="classCode" placeholder="输入班级码（如 A3B7K9）" maxlength="6" />
        <button class="btn btn-primary" @click="joinClass" :disabled="!classCode.trim()">加入班级</button>
        <p class="error" v-if="error">{{ error }}</p>
      </div>

      <div class="success-box" v-else>
        <p>✅ 已加入班级：{{ className }}</p>
      </div>

      <button class="btn skip-btn" @click="goPlay">{{ joined ? '去闯关' : '跳过，以后再说' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { findClassByCode, updateUserClass } from '../lib/api.js'

const router = useRouter()
const authStore = useAuthStore()
authStore.loadFromStorage()

const classCode = ref('')
const error = ref('')
const joined = ref(false)
const className = ref('')

async function joinClass() {
  error.value = ''
  try {
    const cls = await findClassByCode(classCode.value.trim().toUpperCase())
    if (!cls) {
      error.value = '班级码不存在，请检查'
      return
    }
    await updateUserClass(authStore.user.id, cls.id)
    authStore.setUser({ ...authStore.user, class_id: cls.id })
    className.value = cls.name
    joined.value = true
  } catch (e) {
    error.value = '加入失败：' + (e.message || '未知错误')
  }
}

function goPlay() {
  router.push('/select')
}
</script>

<style scoped>
.verify-page {
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
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content {
  text-align: center;
  padding: 20px;
}
.title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 8px;
}
.desc {
  color: #666;
  margin-bottom: 24px;
}

.join-box input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
}
.join-box .btn-primary {
  width: 100%;
  padding: 12px;
}
.error {
  color: #ff4d4f;
  margin-top: 12px;
}

.success-box {
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #52c41a;
  border-radius: 8px;
  margin-bottom: 16px;
}

.skip-btn {
  margin-top: 8px;
}
</style>
