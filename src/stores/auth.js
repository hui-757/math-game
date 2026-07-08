import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 通用用户对象：{ id, nickname, student_number, school, role, class_id }
  const user = ref(null)
  const classInfo = ref(null) // 教师查看的班级

  const isLoggedIn = computed(() => !!user.value)
  const isStudent = computed(() => user.value?.role === 'student')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isInClass = computed(() => !!user.value?.class_id)
  const isTeacherPending = computed(() => user.value?.role === 'teacher_pending')

  function setUser(data) {
    user.value = data
    localStorage.setItem('math-game-user', JSON.stringify(data))
  }

  function setClassInfo(data) {
    classInfo.value = data
    localStorage.setItem('math-game-class', JSON.stringify(data))
  }

  function loadFromStorage() {
    const u = localStorage.getItem('math-game-user')
    const c = localStorage.getItem('math-game-class')
    if (u) user.value = JSON.parse(u)
    if (c) classInfo.value = JSON.parse(c)
  }

  function logout() {
    user.value = null
    classInfo.value = null
    localStorage.removeItem('math-game-user')
    localStorage.removeItem('math-game-class')
  }

  return {
    user, classInfo,
    isLoggedIn, isStudent, isTeacher, isAdmin, isInClass, isTeacherPending,
    setUser, setClassInfo, loadFromStorage, logout
  }
})
