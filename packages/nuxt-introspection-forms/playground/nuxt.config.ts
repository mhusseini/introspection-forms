export default defineNuxtConfig({
  // nuxt-dryv installs the Dryv Vue plugin (reactive validators); this
  // module then hands useDryv to IntrospectionForm.
  modules: ['@softwareproduction/nuxt-dryv', '../src/module'],
})
