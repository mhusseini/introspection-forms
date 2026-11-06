<template>
  <div class="field">
    <label>{{ label }}</label>
    <input v-model="validatable!.value" type="text"/>
    <p v-if="validatable?.text" class="err">{{ validatable.text }}</p>
  </div>
</template>
<script setup lang="ts">
import type { IntrospectionFormEditorProps } from '@softwareproduction/introspection-forms'
defineProps<IntrospectionFormEditorProps>()
</script>
