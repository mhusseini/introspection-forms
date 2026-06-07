<template>
  <div class="form-field" :class="{ 'has-error': errorText }">
    <label v-if="label" :for="id">{{ label }} <span v-if="required" class="required">*</span></label>
    <input
      :id="id"
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      @input="onInput"
      @blur="onBlur"
    />
    <p v-if="errorText" class="error">{{ errorText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    label?: string
    type?: string
    modelValue?: string | number | null
    placeholder?: string
    disabled?: boolean
    required?: boolean
    validatable?: { value: unknown; text: string | null }
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const modelValue = computed(() =>
  props.validatable ? (props.validatable.value as string) : props.modelValue,
)

const errorText = computed(() => props.validatable?.text ?? null)

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (props.validatable) {
    props.validatable.value = val
  }
  emit('update:modelValue', val)
}

function onBlur() {
  // Trigger validation on blur if validatable is present
  if (props.validatable) {
    props.validatable.value = props.validatable.value
  }
}
</script>
