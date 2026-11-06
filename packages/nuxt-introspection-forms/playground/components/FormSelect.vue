<script setup lang="ts">
const model = defineModel<string>()
defineProps<{label?: string; options?: {value: string; label: string}[] | string[]}>()
</script>
<template>
  <label class="block">
    <span>{{ label }}</span>
    <select v-model="model" class="border px-2 py-1 w-full">
      <option v-for="o in options ?? []" :key="typeof o === 'string' ? o : o.value" :value="typeof o === 'string' ? o : o.value">{{ typeof o === 'string' ? o : o.label }}</option>
    </select>
  </label>
</template>
