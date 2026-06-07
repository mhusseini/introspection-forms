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
import type { IntrospectionFormEditorProps } from 'introspection-forms'

withDefaults(
  defineProps<IntrospectionFormEditorProps & {
    type?: string
    placeholder?: string
  }>(),
  { type: 'text' },
)
</script>
