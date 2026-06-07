<template>
  <div class="form-field form-field--textarea" :class="{ 'has-error': errorText }">
    <label v-if="label" :for="id">{{ label }}</label>
    <textarea
      :id="id"
      :value="currentValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows ?? 4"
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
  placeholder?: string
  disabled?: boolean
  rows?: number
  validatable?: { value: unknown; text: string | null }
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const currentValue = computed(() => (props.validatable?.value as string) ?? '')
const errorText = computed(() => props.validatable?.text ?? null)

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  if (props.validatable) {
    props.validatable.value = val
  }
  emit('update:modelValue', val)
}
</script>
