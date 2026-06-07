<template>
  <div class="form-field form-field--checkbox" :class="{ 'has-error': errorText }">
    <label>
      <input
        type="checkbox"
        :checked="checked"
        :disabled="disabled"
        :required="required"
        @change="onChange"
      />
      <span>{{ label }} <span v-if="required" class="required">*</span></span>
    </label>
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

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const checked = computed(() => !!props.validatable?.value)
const errorText = computed(() => props.validatable?.text ?? null)

function onChange(e: Event) {
  const val = (e.target as HTMLInputElement).checked
  if (props.validatable) {
    props.validatable.value = val
  }
  emit('update:modelValue', val)
}
</script>
