import { IntrospectionFormsPlugin } from '@softwareproduction/introspection-forms/plugin'
import FormInput from '~/components/FormInput.vue'
import FormCheckbox from '~/components/FormCheckbox.vue'
import FormSelect from '~/components/FormSelect.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(IntrospectionFormsPlugin, {
    defaults: {
      byFieldType: {
        string: {component: FormInput},
        boolean: {component: FormCheckbox},
        enum: (introspection) => ({component: FormSelect, props: {options: introspection.enumValues}}),
      },
    },
    translate: (key: string) => {
      const field = key.split('.').pop() ?? key
      return field.charAt(0).toUpperCase() + field.slice(1)
    },
  })
})
