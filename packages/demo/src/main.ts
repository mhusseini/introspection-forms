import { createApp } from 'vue'
import { Dryv, type DryvOptions } from 'dryvue'
import { IntrospectionFormsPlugin } from 'introspection-forms/plugin'
import App from './App.vue'
import FormInput from './components/FormInput.vue'
import FormCheckbox from './components/FormCheckbox.vue'
import FormRadio from './components/FormRadio.vue'
import FormSelect from './components/FormSelect.vue'
import FormTextarea from './components/FormTextarea.vue'
import FormDateInput from './components/FormDateInput.vue'

const app = createApp(App)

// Install Dryv (no server — all rules are local)
app.use<DryvOptions>(Dryv, {
  objectValidation: 'afterFirstValidation',
})

// Install IntrospectionForms with component mapping
app.use(IntrospectionFormsPlugin, {
  defaults: {
    byFieldType: {
      string: { component: FormInput },
      number: { component: FormInput, props: { type: 'number' } },
      boolean: { component: FormCheckbox },
      enum: (introspection) => ({
        component: FormRadio,
        props: {
          options: () =>
            introspection.enumValues.map((value) => ({
              value,
              label: value,
            })),
        },
      }),
    },
    byOriginalType: {
      DateTime: { component: FormDateInput },
      Float: { component: FormInput, props: { type: 'number' } },
    },
    byFieldName: [
      { regexp: /^email$/i, config: { component: FormInput, props: { type: 'email' } } },
      { regexp: /phone|telefon/i, config: { component: FormInput, props: { type: 'tel' } } },
      { regexp: /^(notes|body|message)$/i, config: { component: FormTextarea } },
      { regexp: /status$/i, config: { component: FormSelect } },
    ],
    enumFilters: {
      Salutation: (values) => values.filter((v) => v !== 'None'),
    },
  },
})

app.mount('#app')
