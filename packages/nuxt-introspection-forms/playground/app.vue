<script setup lang="ts">
import { reactive } from 'vue'
import type { DryvValidationRuleSet } from '@softwareproduction/dryvjs'
import { useIntrospectionForm } from '@softwareproduction/introspection-forms'
import { ContactForm } from '#introspection-types/ContactForm'

const rules: DryvValidationRuleSet<{name: string; newsletter: boolean; country: string}> = {
  name: 'ContactForm',
  validators: {
    name: [{annotations: {required: true}, validate: ($m) => (!$m.name?.trim() ? 'Name is required' : null)}],
  },
}
const model = reactive({name: '', newsletter: false, country: 'DE'})
const form = useIntrospectionForm(ContactForm, rules, {name: true, newsletter: true, country: true})
const validate = ref<(checkOnly?: boolean) => Promise<boolean>>()
const submitted = ref(false)
async function submit() {
  const ok = await validate.value?.()
  if (ok) submitted.value = true
}
</script>
<template>
  <main class="p-8 max-w-md mx-auto space-y-4">
    <h1 class="text-xl font-semibold">Introspection forms playground</h1>
    <IntrospectionForm v-model:validate="validate" :model="model" :form="form" :columns="1" @submit.prevent="submit"/>
    <button class="border px-4 py-2" @click="submit">Submit</button>
    <p v-if="submitted" class="text-green-700">Submitted!</p>
  </main>
</template>
