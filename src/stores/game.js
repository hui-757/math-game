import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const currentQuestions = ref([])
  const currentIndex = ref(0)
  const userAnswers = ref({})
  const startTime = ref(0)
  const elapsedTime = ref(0)
  const levelId = ref('')
  const lastResult = ref(null)

  function initGame(questions, level) {
    currentQuestions.value = questions
    currentIndex.value = 0
    userAnswers.value = {}
    startTime.value = Date.now()
    elapsedTime.value = 0
    levelId.value = level
  }

  function setAnswer(blankId, value) {
    userAnswers.value[blankId] = value
  }

  function nextQuestion() {
    if (currentIndex.value < currentQuestions.value.length - 1) {
      currentIndex.value++
    }
  }

  function finishGame() {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }

  function setResult(result) {
    lastResult.value = result
  }

  function clearGame() {
    currentQuestions.value = []
    currentIndex.value = 0
    userAnswers.value = {}
    levelId.value = ''
    lastResult.value = null
  }

  return {
    currentQuestions, currentIndex, userAnswers, startTime, elapsedTime, levelId, lastResult,
    initGame, setAnswer, nextQuestion, finishGame, setResult, clearGame
  }
})
