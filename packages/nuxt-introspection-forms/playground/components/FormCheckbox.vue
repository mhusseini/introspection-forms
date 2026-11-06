<template>
  <label class="field"><input type="checkbox" v-model="validatable!.value"/> {{ label }}</label>
</template>
<script setup lang="ts">
import type { IntrospectionFormEditorProps } from '@softwareproduction/introspection-forms'
defineProps<IntrospectionFormEditorProps>()
</script>
