<template>
  <div class="form-field" :class="{ 'has-error': errorText }">
    <label v-if="label" :for="id">{{ label }}</label>
    <input
      :id="id"
      type="date"
      :value="currentValue"
      :disabled="disabled"
      @input="onInput"
    />
    <p v-if="errorText" class="error">{{ errorText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id?: string
  name?: string
  label?: string
  disabled?: boolean
  required?: boolean
  validatable?: { value: unknown; text: string | null }
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const currentValue = computed(() => (props.validatable?.value as string) ?? '')
const errorText = computed(() => props.validatable?.text ?? null)

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (props.validatable) {
    props.validatable.value = val
  }
  emit('update:modelValue', val)
}
</script>
