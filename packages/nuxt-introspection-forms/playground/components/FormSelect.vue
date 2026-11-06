<template>
  <div class="field">
    <label>{{ label }}</label>
    <select v-model="validatable!.value">
      <option v-for="o in options ?? []" :key="o" :value="o">{{ o }}</option>
    </select>
  </div>
</template>
<script setup lang="ts">
import type { IntrospectionFormEditorProps } from '@softwareproduction/introspection-forms'
defineProps<IntrospectionFormEditorProps & {options?: string[]}>()
</script>
