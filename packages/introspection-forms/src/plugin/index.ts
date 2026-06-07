import type { App, Component, Plugin } from 'vue'
import type { IntrospectionFormsPluginOptions, Translate } from '../types'
import { INTROSPECTION_FORMS_KEY } from './keys'

/**
 * Vue plugin that provides global configuration for component resolution
 * and optionally registers the IntrospectionForm/IntrospectionField components.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { IntrospectionFormsPlugin } from 'introspection-forms/plugin'
 * import IntrospectionForm from 'introspection-forms/components/IntrospectionForm.vue'
 * import IntrospectionField from 'introspection-forms/components/IntrospectionField.vue'
 * import { FormInput, FormCheckbox } from './my-components'
 *
 * const app = createApp(App)
 * app.use(IntrospectionFormsPlugin, {
 *   components: { IntrospectionForm, IntrospectionField },
 *   translate: (key) => i18n.global.t(key),
 *   defaults: {
 *     byFieldType: {
 *       string: { component: FormInput },
 *       boolean: { component: FormCheckbox },
 *     },
 *     byFieldName: [
 *       { regexp: /^email/i, config: { component: FormInput, props: { type: 'email' } } },
 *     ],
 *   },
 * })
 * ```
 */
export const IntrospectionFormsPlugin: Plugin<[IntrospectionFormsPluginOptions & { components?: { IntrospectionForm?: Component; IntrospectionField?: Component } }]> = {
  install(app: App, options?: IntrospectionFormsPluginOptions & { components?: { IntrospectionForm?: Component; IntrospectionField?: Component } }) {
    if (options?.defaults) {
      app.provide(INTROSPECTION_FORMS_KEY, options.defaults)
    }

    if (options?.translate) {
      app.provide('introspection-forms:translate', options.translate)
    }

    app.provide('introspection-forms:translationPrefix', options?.translationPrefix ?? 'forms.')

    if (options?.components?.IntrospectionForm) {
      app.component('IntrospectionForm', options.components.IntrospectionForm)
    }
    if (options?.components?.IntrospectionField) {
      app.component('IntrospectionField', options.components.IntrospectionField)
    }
  },
}

/**
 * @deprecated Use the `translate` option in `IntrospectionFormsPlugin` instead.
 */
export function provideTranslate(app: App, t: Translate): void {
  app.provide('introspection-forms:translate', t)
}

export { INTROSPECTION_FORMS_KEY }
