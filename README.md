# Introspection Forms

Stop hand-coding form templates. **Introspection Forms** generates fully reactive Vue 3 forms from your existing data model — whether that's a GraphQL schema or an OpenAPI spec. Run the code generator once, and you get type-safe forms with automatic component resolution, validation, conditional fields, nested sub-forms, and storage persistence — all driven by metadata, not markup.

---

## Packages

### [`@softwareproduction/introspection-forms`](./packages/introspection-forms)

The core library that powers everything. It includes the code generators (GraphQL and OpenAPI), a Vue composable that turns generated metadata into a reactive form runtime, pre-built form components, and a Vue plugin for global component mapping. If you're using Vue 3 standalone, this is all you need.

### [`@softwareproduction/nuxt-introspection-forms`](./packages/nuxt-introspection-forms)

A Nuxt module that wraps the core library for zero-boilerplate integration with Nuxt 3 and 4 apps. It auto-registers components, auto-imports composables, sets up path aliases, and injects global defaults — so you can drop schema-driven forms into any page without manual wiring.

### [`@softwareproduction/introspection-forms-demo`](./packages/demo)

A standalone Vue 3 demo application showcasing a complex multi-section registration form with conditional fields, nested address sub-forms, enum filtering, and local Dryv validation — all running client-side with no backend required. A good starting point to see the library in action.

---

## Quick Start

```bash
yarn install
yarn workspace @softwareproduction/introspection-forms build
yarn workspace @softwareproduction/introspection-forms-demo dev
```

## License

MIT
