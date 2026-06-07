<template>
  <div class="form-field form-field--select" :class="{ 'has-error': validatable?.text }">
    <label v-if="label" :for="id">{{ label }} <span v-if="required" class="required">*</span></label>
    <select
      v-if="validatable"
      :id="id"
      :disabled="disabled"
      :required="required"
      v-model="validatable.value"
    >
      <option value="" disabled>— Select —</option>
      <option v-for="opt in resolvedOptions" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="validatable?.text" class="error">{{ validatable.text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IntrospectionFormEditorProps } from 'introspection-forms'

export interface SelectOption {
  value: unknown
  label: string
}

const props = defineProps<IntrospectionFormEditorProps & {
  options?: SelectOption[] | ((model: unknown, t: (key: string) => string) => SelectOption[])
}>()

const resolvedOptions = computed(() => {
  if (!props.options) return []
  if (typeof props.options === 'function') return props.options(null, (k: string) => k)
  return props.options
})
</script>
