<template>
  <div class="form-field form-field--checkbox" :class="{ 'has-error': validatable?.text }">
    <label v-if="validatable">
      <input
        type="checkbox"
        v-model="validatable.value"
        :disabled="disabled"
        :required="required"
      />
      <span>{{ label }} <span v-if="required" class="required">*</span></span>
    </label>
    <p v-if="validatable?.text" class="error">{{ validatable.text }}</p>
  </div>
</template>

<script setup lang="ts">
import type { IntrospectionFormEditorProps } from 'introspection-forms'

defineProps<IntrospectionFormEditorProps>()
</script>
