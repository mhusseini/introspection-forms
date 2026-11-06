import type { InjectionKey } from 'vue'
import type { IntrospectionFormsDefaults } from '../types'

export const INTROSPECTION_FORMS_KEY: InjectionKey<IntrospectionFormsDefaults> =
  Symbol('introspection-forms')

import type { useDryv } from '@softwareproduction/dryvue'

/** Signature of dryvue's `useDryv` composable, injected by the consuming app. */
export type UseDryvFn = typeof useDryv

/**
 * Injection key carrying the app's `useDryv` function. Validation in
 * IntrospectionForm is deliberately opt-in via this injection so the dryvue
 * dependency never becomes a silent no-op (or a hard import) here.
 */
export const INTROSPECTION_FORMS_USE_DRYV_KEY: InjectionKey<UseDryvFn> =
  Symbol('introspection-forms:useDryv')
