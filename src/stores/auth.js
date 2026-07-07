import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const student = ref(null)
  const classInfo = ref(null)

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

  return { student, classInfo, setStudent, setClassInfo, loadFromStorage, logout }
})
