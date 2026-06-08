<template>
  <div class="form-field form-field--radio" :class="{ 'has-error': validatable?.text }">
    <fieldset v-if="validatable" :disabled="disabled">
      <legend v-if="label">{{ label }} <span v-if="required" class="required">*</span></legend>
      <label v-for="opt in resolvedOptions" :key="String(opt.value)" class="radio-option">
        <input
          type="radio"
          :name="name || id"
          :value="opt.value"
          v-model="validatable.value"
        />
        <span>{{ opt.label }}</span>
      </label>
    </fieldset>
    <p v-if="validatable?.text" class="error">{{ validatable.text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IntrospectionFormEditorProps } from '@softwareproduction/introspection-forms'

export interface RadioOption {
  value: unknown
  label: string
}

const props = defineProps<IntrospectionFormEditorProps & {
  options?: RadioOption[] | ((model: unknown, t: (key: string) => string) => RadioOption[])
}>()

const resolvedOptions = computed(() => {
  if (!props.options) return []
  if (typeof props.options === 'function') return props.options(null, (k: string) => k)
  return props.options
})
</script>
