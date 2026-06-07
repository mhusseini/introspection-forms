import type { InjectionKey } from 'vue'
import type { IntrospectionFormsDefaults } from '../types'

export const INTROSPECTION_FORMS_KEY: InjectionKey<IntrospectionFormsDefaults> =
  Symbol('introspection-forms')
