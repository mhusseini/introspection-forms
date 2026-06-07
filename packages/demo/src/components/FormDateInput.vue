<template>
  <div class="form-field" :class="{ 'has-error': validatable?.text }">
    <label v-if="label" :for="id">{{ label }}</label>
    <input
      v-if="validatable"
      :id="id"
      type="date"
      v-model="validatable.value"
      :disabled="disabled"
      :required="required"
    />
    <p v-if="validatable?.text" class="error">{{ validatable.text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id?: string
  name?: string
  label?: string
  disabled?: boolean
  required?: boolean
  validatable?: { value: unknown; text: string | null }
}>()
</script>
