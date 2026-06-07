<template>
  <div class="form-field form-field--select" :class="{ 'has-error': errorText }">
    <label v-if="label" :for="id">{{ label }} <span v-if="required" class="required">*</span></label>
    <select
      :id="id"
      :disabled="disabled"
      :required="required"
      :value="currentValue"
      @change="onChange"
    >
      <option value="" disabled>— Select —</option>
      <option v-for="opt in resolvedOptions" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="errorText" class="error">{{ errorText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface SelectOption {
  value: unknown
  label: string
}

const props = defineProps<{
  id?: string
  name?: string
  label?: string
  disabled?: boolean
  required?: boolean
  options?: SelectOption[] | ((model: unknown, t: (key: string) => string) => SelectOption[])
  validatable?: { value: unknown; text: string | null }
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const currentValue = computed(() => props.validatable?.value ?? '')
const errorText = computed(() => props.validatable?.text ?? null)

const resolvedOptions = computed(() => {
  if (!props.options) return []
  if (typeof props.options === 'function') return props.options(null, (k: string) => k)
  return props.options
})

function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (props.validatable) {
    props.validatable.value = val
  }
  emit('update:modelValue', val)
}
</script>
