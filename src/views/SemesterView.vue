<template>
  <div class="semester-page">
    <div class="header">
      <button class="btn" @click="$router.push('/select')">返回</button>
      <h2>{{ grade }}年级</h2>
      <span></span>
    </div>

    <p class="hint">选择册次</p>

    <div class="semester-list">
      <div class="semester-card" @click="go(1)">
        <div class="semester-label">上册</div>
        <div class="semester-desc">第1学期</div>
      </div>
      <div class="semester-card" @click="go(2)">
        <div class="semester-label">下册</div>
        <div class="semester-desc">第2学期</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps(['grade'])
const router = useRouter()

function go(semester) {
  router.push(`/unit/${props.grade}/${semester}`)
}
</script>

<style scoped>
.semester-page {
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
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 14px;
}
.hint {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}
.semester-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.semester-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
}
.semester-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.semester-label {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}
.semester-desc {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
</style>
