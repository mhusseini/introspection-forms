import { defineNuxtPlugin } from '#app'
import { INTROSPECTION_FORMS_KEY } from 'introspection-forms'
import type { IntrospectionFormsDefaults } from 'introspection-forms'

/**
 * Nuxt plugin that provides the global introspection-forms defaults configuration.
 *
 * Users should configure defaults in their nuxt.config.ts under the `introspectionForms` key,
 * or provide them programmatically via a custom plugin that runs after this one.
 *
 * @example nuxt.config.ts
 * ```ts
 * export default defineNuxtConfig({
 *   introspectionForms: {
 *     defaults: {
 *       byFieldType: {
 *         string: { component: FormInput },
 *         boolean: { component: FormCheckbox },
 *       }
 *     }
 *   }
 * })
 * ```
 *
 * @example Custom plugin for dynamic configuration (app/plugins/configure-forms.ts)
 * ```ts
 * import { FormInput, FormCheckbox, FormRadio } from './components'
 * import type { IntrospectionFormsDefaults } from 'introspection-forms'
 *
 * export default defineNuxtPlugin(nuxtApp => {
 *   nuxtApp.provide('introspection-forms', {
 *     byFieldType: {
 *       string: { component: FormInput },
 *       boolean: { component: FormCheckbox },
 *       enum: { component: FormRadio },
 *     },
 *   } satisfies IntrospectionFormsDefaults)
 * })
 * ```
 */
export default defineNuxtPlugin({
  name: 'introspection-forms',
  setup(nuxtApp) {
    // The plugin provides the injection key for the composables to use.
    // Users provide the actual defaults via their own plugin or nuxt.config.
    const existingDefaults = nuxtApp.$introspectionForms as IntrospectionFormsDefaults | undefined

    if (existingDefaults) {
      nuxtApp.vueApp.provide(INTROSPECTION_FORMS_KEY, existingDefaults)
    }
  },
})
