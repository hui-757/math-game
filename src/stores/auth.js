import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const student = ref(null)    // { id(uuid), student_number, nickname, class_id }
  const classInfo = ref(null)   // { id, code, name } — 教师查看的班级

  const isStudent = computed(() => !!student.value)
  const isInClass = computed(() => !!student.value?.class_id)

  function setStudent(data) {
    student.value = data
    localStorage.setItem('math-game-student', JSON.stringify(data))
  }

  function setClassInfo(data) {
    classInfo.value = data
    localStorage.setItem('math-game-class', JSON.stringify(data))
  }

  function loadFromStorage() {
    const s = localStorage.getItem('math-game-student')
    const c = localStorage.getItem('math-game-class')
    if (s) student.value = JSON.parse(s)
    if (c) classInfo.value = JSON.parse(c)
  }

  function logout() {
    student.value = null
    classInfo.value = null
    localStorage.removeItem('math-game-student')
    localStorage.removeItem('math-game-class')
  }

  return { student, classInfo, isStudent, isInClass, setStudent, setClassInfo, loadFromStorage, logout }
})
