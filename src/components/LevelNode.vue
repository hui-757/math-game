<template>
  <g class="level-node" :class="status" @click="$emit('click')">
    <circle :cx="x" :cy="y" :r="status === 'completed' ? 28 : 24" :fill="fillColor" stroke="white" stroke-width="3"/>
    <text v-if="status === 'completed'" :x="x" :y="y" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16">⭐</text>
    <text v-else-if="status === 'unlocked'" :x="x" :y="y" text-anchor="middle" dominant-baseline="central" fill="white" font-size="14">GO</text>
    <text v-else :x="x" :y="y" text-anchor="middle" dominant-baseline="central" fill="#999" font-size="16">🔒</text>
    <text :x="x" :y="y + 40" text-anchor="middle" fill="#666" font-size="12">{{ label }}</text>
  </g>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ x: Number, y: Number, status: String, label: String })
const fillColor = computed(() => {
  if (props.status === 'completed') return '#52c41a'
  if (props.status === 'unlocked') return '#faad14'
  return '#d9d9d9'
})
</script>

<style scoped>
.level-node { cursor: pointer; }
.level-node.locked { cursor: not-allowed; }
</style>
