<template>
  <div class="join-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回</button>
      <h2>加入班级</h2>
      <span></span>
    </div>

    <div class="form" v-if="!joined">
      <p class="hint">输入班级信息，加入后闯关进度会自动同步到班级。</p>
      <input type="text" v-model="classCode" placeholder="班级码（如 A3B7K9）" maxlength="6" />
      <input type="text" v-model="studentNumber" placeholder="学号" />
      <input type="text" v-model="studentName" placeholder="姓名" />
      <button class="btn btn-primary" @click="join" :disabled="!canSubmit">加入班级</button>
      <p class="error" v-if="error">{{ error }}</p>
    </div>

    <div class="success" v-else>
      <p>加入成功！</p>
      <p>班级：{{ className }}</p>
      <button class="btn btn-primary" @click="$router.push('/select')">去闯关</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useProgressStore } from '../stores/progress.js'
import { findClassByCode, findStudentByNumber, createStudent } from '../lib/api.js'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const classCode = ref('')
const studentNumber = ref('')
const studentName = ref('')
const error = ref('')
const joined = ref(false)
const className = ref('')

const canSubmit = computed(() => {
  return classCode.value.trim().length >= 4 && studentNumber.value.trim() && studentName.value.trim()
})

async function join() {
  error.value = ''
  try {
    const cls = await findClassByCode(classCode.value.trim().toUpperCase())
    if (!cls) {
      error.value = '班级码不存在，请检查'
      return
    }

    const existing = await findStudentByNumber(cls.id, studentNumber.value.trim())
    if (existing) {
      if (existing.nickname === studentName.value.trim()) {
        // 已有记录，直接登录
        authStore.setStudent({
          id: existing.id,
          student_number: existing.student_number,
          nickname: existing.nickname,
          class_id: existing.class_id
        })
        await syncProgress(existing.id)
        className.value = cls.name
        joined.value = true
        return
      }
      error.value = '该学号已被其他姓名注册，请联系教师'
      return
    }

    // 创建新学生
    const newStudent = await createStudent(cls.id, studentNumber.value.trim(), studentName.value.trim())
    authStore.setStudent({
      id: newStudent.id,
      student_number: newStudent.student_number,
      nickname: newStudent.nickname,
      class_id: newStudent.class_id
    })
    await syncProgress(newStudent.id)
    className.value = cls.name
    joined.value = true
  } catch (e) {
    error.value = '加入失败：' + (e.message || '未知错误')
  }
}

async function syncProgress(studentId) {
  const localRecords = progressStore.records
  if (localRecords.length === 0) return
  // 遍历本地记录，提交到云端
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
    } catch (e) { /* 静默失败，继续 */ }
  }
}
</script>

<style scoped>
.join-page {
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

.form {
  text-align: center;
}
.hint {
  color: #666;
  margin-bottom: 20px;
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
.error {
  color: #ff4d4f;
  margin-top: 12px;
}

.success {
  text-align: center;
  padding: 40px;
}
.success p {
  font-size: 18px;
  margin-bottom: 8px;
}
</style>
