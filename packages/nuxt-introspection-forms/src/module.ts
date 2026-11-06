import { defineNuxtModule, createResolver, addComponent, addImportsDir, addPlugin, tryResolveModule } from '@nuxt/kit'
import { join } from 'path'

export interface ModuleOptions {
  /**
   * The folder where the generated introspection types are located (relative to rootDir).
   * @default 'types/generated/introspection'
   */
  generatedPath?: string

  /**
   * Provide `useDryv` from `@softwareproduction/dryvue` to IntrospectionForm
   * for validation. 'auto' enables it when the package is resolvable;
   * `true` requires it (build fails otherwise); `false` disables it.
   * @default 'auto'
   */
  dryv?: boolean | 'auto'
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
    dryv: 'auto',
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // The package ships raw SFCs: they must be transpiled for SSR.
    nuxt.options.build.transpile.push('@softwareproduction/introspection-forms')

    // Register components (default-exported SFCs in the package).
    addComponent({
      name: 'IntrospectionForm',
      filePath: '@softwareproduction/introspection-forms/components/IntrospectionForm.vue',
    })
    addComponent({
      name: 'IntrospectionField',
      filePath: '@softwareproduction/introspection-forms/components/IntrospectionField.vue',
    })

    // Add alias for generated types
    nuxt.options.alias['#introspection-types'] = join(nuxt.options.rootDir, options.generatedPath!)

    // Auto-import composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Validation wiring: provide the app's useDryv via injection.
    const dryvRequested = options.dryv === true || options.dryv === 'auto'
    const dryvPath = await tryResolveModule('@softwareproduction/dryvue', nuxt.options.modulesDir)
    if (options.dryv === true && !dryvPath) {
      throw new Error(
        'introspectionForms.dryv is enabled but @softwareproduction/dryvue is not installed. ' +
          'Run `yarn add @softwareproduction/dryvue` (peer, >=2.1.0).',
      )
    }
    if (dryvRequested && dryvPath) {
      addPlugin({
        src: resolver.resolve('./runtime/plugins/dryv'),
        mode: 'all',
      })
    }
  },
})
