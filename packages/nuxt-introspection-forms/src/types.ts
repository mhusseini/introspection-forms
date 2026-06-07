export type { ModuleOptions } from './module'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    introspectionForms?: import('./module').ModuleOptions
  }
  interface NuxtOptions {
    introspectionForms?: import('./module').ModuleOptions
  }
}

declare module '#app' {
  interface NuxtApp {
    $introspectionForms?: import('introspection-forms').IntrospectionFormsDefaults
  }
}
