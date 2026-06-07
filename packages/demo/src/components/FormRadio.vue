<template>
  <div class="form-field form-field--radio" :class="{ 'has-error': errorText }">
    <fieldset :disabled="disabled">
      <legend v-if="label">{{ label }} <span v-if="required" class="required">*</span></legend>
      <label v-for="opt in resolvedOptions" :key="String(opt.value)" class="radio-option">
        <input
          type="radio"
          :name="name || id"
          :value="opt.value"
          :checked="currentValue === opt.value"
          @change="onSelect(opt.value)"
        />
        <span>{{ opt.label }}</span>
      </label>
    </fieldset>
    <p v-if="errorText" class="error">{{ errorText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface RadioOption {
  value: unknown
  label: string
}

const props = defineProps<{
  id?: string
  name?: string
  label?: string
  disabled?: boolean
  required?: boolean
  options?: RadioOption[] | ((model: unknown, t: (key: string) => string) => RadioOption[])
  validatable?: { value: unknown; text: string | null }
}>()

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const currentValue = computed(() => props.validatable?.value)
const errorText = computed(() => props.validatable?.text ?? null)

const resolvedOptions = computed(() => {
  if (!props.options) return []
  if (typeof props.options === 'function') return props.options(null, (k: string) => k)
  return props.options
})

function onSelect(value: unknown) {
  if (props.validatable) {
    props.validatable.value = value
  }
  emit('update:modelValue', value)
}
</script>
