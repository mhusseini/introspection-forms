<template>
  <div class="form-field" :class="{ 'has-error': validatable?.text }">
    <label v-if="label" :for="id">{{ label }} <span v-if="required" class="required">*</span></label>
    <input
      v-if="validatable"
      :id="id"
      :type="type ?? 'text'"
      v-model="validatable.value"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
    />
    <p v-if="validatable?.text" class="error">{{ validatable.text }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    name?: string
    label?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    validatable?: { value: unknown; text: string | null }
  }>(),
  { type: 'text' },
)
</script>
