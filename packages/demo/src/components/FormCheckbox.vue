<template>
  <div class="form-field form-field--checkbox" :class="{ 'has-error': validatable?.text }">
    <label v-if="validatable">
      <input
        type="checkbox"
        v-model="validatable.value"
        :disabled="disabled"
        :required="required"
      />
      <span>{{ label }} <span v-if="required" class="required">*</span></span>
    </label>
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
