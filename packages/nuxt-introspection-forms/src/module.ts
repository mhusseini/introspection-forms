import { defineNuxtModule, createResolver, addComponent, addImportsDir, addPlugin } from '@nuxt/kit'
import { join } from 'path'

export interface ModuleOptions {
  /**
   * The folder where the generated introspection types are located (relative to rootDir).
   * @default 'types/generated/introspection'
   */
  generatedPath?: string

  /**
   * Component mapping configuration for automatic field resolution.
   * Configure which Vue components render which field types.
   */
  defaults?: {
    /** Map field TypeScript types (string, number, boolean, enum) to component configs. */
    byFieldType?: Record<string, unknown>
    /** Map original GraphQL types (DateTime, etc.) to component configs. */
    byOriginalType?: Record<string, unknown>
    /** Match field names by regex to component configs. */
    byFieldName?: { regexp: RegExp; config: unknown }[]
    /** Filter enum values by original type name. */
    enumFilters?: Record<string, (values: string[]) => string[]>
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@softwareproduction/nuxt-introspection-forms',
    configKey: 'introspectionForms',
    compatibility: {
      nuxt: '^3.16.0 || ^4.0.0',
    },
  },
  defaults: {
    generatedPath: 'types/generated/introspection',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Register components
    addComponent({
      name: 'IntrospectionForm',
      filePath: '@softwareproduction/introspection-forms',
      export: 'IntrospectionForm',
    })

    addComponent({
      name: 'IntrospectionField',
      filePath: '@softwareproduction/introspection-forms',
      export: 'IntrospectionField',
    })

    // Add alias for generated types
    nuxt.options.alias['#introspection-types'] = join(nuxt.options.rootDir, options.generatedPath!)

    // Add alias for the introspection-forms package types
    nuxt.options.alias['#introspection-forms'] = '@softwareproduction/introspection-forms'

    // Auto-import composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Add plugin for global defaults configuration
    addPlugin({
      src: resolver.resolve('./runtime/plugins/introspection-forms.client'),
      mode: 'all',
    })

    // Store options in runtime config for the plugin to access
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    ;(nuxt.options.runtimeConfig as Record<string, unknown>).__introspectionFormsDefaults = options.defaults
      ? JSON.parse(JSON.stringify(options.defaults, (_key, value) => {
          if (value instanceof RegExp) return `__REGEXP__${value.source}__FLAGS__${value.flags}`
          if (typeof value === 'function') return `__FUNCTION__${value.toString()}`
          return value
        }))
      : undefined

    // Provide module options via app config for the plugin
    nuxt.options.appConfig = nuxt.options.appConfig || {}
    ;(nuxt.options.appConfig as Record<string, unknown>).introspectionForms = {
      hasDefaults: !!options.defaults,
    }
  },
})
