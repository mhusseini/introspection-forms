<template>
  <div class="form-field form-field--textarea" :class="{ 'has-error': validatable?.text }">
    <label v-if="label" :for="id">{{ label }}</label>
    <textarea
      v-if="validatable"
      :id="id"
      v-model="validatable.value"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows ?? 4"
    />
    <p v-if="validatable?.text" class="error">{{ validatable.text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id?: string
  name?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  validatable?: { value: unknown; text: string | null }
}>()
</script>
