<template>
  <input
    type="text"
    inputmode="numeric"
    class="math-blank"
    :class="{ filled: modelValue }"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    maxlength="8"
  />
</template>

<script setup>
const props = defineProps({ blankId: String, answer: String, modelValue: String })
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.math-blank {
  width: 3.5rem;
  height: 2.5rem;
  border: 2px solid #ccc;
  border-radius: 6px;
  text-align: center;
  font-size: 1.4rem;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: 0.2s;
  margin: 0 4px;
}
.math-blank:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
.math-blank.filled {
  border-color: #409eff;
  background: #f0f9ff;
}
</style>
