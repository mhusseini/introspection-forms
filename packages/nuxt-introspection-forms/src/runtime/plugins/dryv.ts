import { defineNuxtPlugin, type NuxtApp } from 'nuxt/app'
import { useDryv } from '@softwareproduction/dryvue'
import { INTROSPECTION_FORMS_USE_DRYV_KEY } from '@softwareproduction/introspection-forms/plugin'

// Provides the app's useDryv to IntrospectionForm via injection.
export default defineNuxtPlugin((nuxtApp: NuxtApp) => {
  nuxtApp.vueApp.provide(INTROSPECTION_FORMS_USE_DRYV_KEY, useDryv)
})
