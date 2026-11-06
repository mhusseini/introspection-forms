<script setup lang="ts">
const model = defineModel<string>()
defineProps<{label?: string; text?: string | null}>()
</script>
<template>
  <label class="block">
    <span>{{ label }}</span>
    <input v-model="model" class="border px-2 py-1 w-full"/>
    <em v-if="text" class="text-red-600 text-sm">{{ text }}</em>
  </label>
</template>
