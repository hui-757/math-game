import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProgress } from '../lib/api.js'

export const useProgressStore = defineStore('progress', () => {
  const records = ref([])

  async function load(studentId) {
    records.value = await fetchProgress(studentId)
    // 同时保存到 localStorage 作为本地备份
    localStorage.setItem('math-game-progress', JSON.stringify(records.value))
  }

  function loadFromStorage() {
    const data = localStorage.getItem('math-game-progress')
    if (data) {
      try {
        records.value = JSON.parse(data)
      } catch (e) {
        records.value = []
      }
    }
  }

  function saveToStorage() {
    localStorage.setItem('math-game-progress', JSON.stringify(records.value))
  }

  function addRecord(record) {
    // 去重：同一关卡只保留最新记录
    const idx = records.value.findIndex(r => r.level_id === record.level_id)
    if (idx >= 0) {
      records.value[idx] = record
    } else {
      records.value.push(record)
    }
    saveToStorage()
  }

  function isLevelCompleted(levelId) {
    return records.value.some(r => r.level_id === levelId)
  }

  function isLevelUnlocked(grade, semester, unit, level) {
    const id = `${grade}-${semester}-${unit}-${level}`
    if (level === 1) return true
    const prevId = `${grade}-${semester}-${unit}-${level - 1}`
    return isLevelCompleted(prevId)
  }

  function getLevelStars(levelId) {
    const r = records.value.find(r => r.level_id === levelId)
    if (!r) return 0
    const ratio = r.correct_count / r.total_count
    if (ratio >= 0.9) return 3
    if (ratio >= 0.8) return 2
    return 1
  }

  return { records, load, loadFromStorage, saveToStorage, addRecord, isLevelCompleted, isLevelUnlocked, getLevelStars }
})
