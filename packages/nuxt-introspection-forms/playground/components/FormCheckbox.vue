<script setup lang="ts">
const model = defineModel<boolean>()
defineProps<{label?: string}>()
</script>
<template>
  <label class="flex gap-2"><input type="checkbox" v-model="model"/>{{ label }}</label>
</template>
