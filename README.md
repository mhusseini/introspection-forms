# Introspection Forms

Schema-driven form generation for Vue 3 from GraphQL introspection metadata. Define your data model once in a GraphQL schema, run the code generator, and get fully reactive forms with automatic component resolution, validation, conditional fields, and storage persistence.

## Packages

| Package | Description |
|---------|-------------|
| [`introspection-forms`](./packages/introspection-forms) | Core library — types, composables, Vue components, GraphQL Codegen plugin, Vue plugin |
| [`nuxt-introspection-forms`](./packages/nuxt-introspection-forms) | Nuxt module wrapper — auto-imports, component registration, alias config |
| [`introspection-forms-demo`](./packages/demo) | Standalone Vue 3 demo app with a complex form and local Dryv validation |

## Quick Start

```bash
# Install dependencies
yarn install

# Build the core library
yarn workspace introspection-forms build

# Build the Nuxt module
yarn workspace nuxt-introspection-forms build

# Run the demo
yarn workspace introspection-forms-demo dev
```

## How It Works

```
GraphQL Schema (input types)
        │
        ▼  codegen
TypeScript metadata (IntrospectionType<T>)
        │
        ▼  useIntrospectionForm()
FormRuntime (reactive field configs)
        │
        ▼  <IntrospectionForm>
Rendered form (component mapping + validation)
```

1. **Schema** — Your data model is a GraphQL `input` type with enums, scalars, nested objects.
2. **Codegen** — The `introspection-forms/codegen` plugin generates one `IntrospectionType<T>` constant per input type. Each contains field metadata, type information, enum values, and a `create()` factory.
3. **Composable** — `useIntrospectionForm()` merges the metadata with your per-field config and global defaults into a `FormRuntime`.
4. **Rendering** — `<IntrospectionForm>` iterates over the runtime fields, resolves the correct component for each, and wires up reactivity, validation, and storage persistence.

## Key Features

- **Automatic component resolution** — map TypeScript types, GraphQL types, or field name patterns to Vue components via a single plugin config.
- **Conditional fields** — `visible`, `disabled`, `label`, and `span` accept functions receiving the current model.
- **Nested forms** — complex object fields render recursively with their own form runtime.
- **Validation integration** — first-class support for [Dryv](https://github.com/mhusseini/dryvjs) rule sets; inline error display with no extra wiring.
- **Enum filtering** — globally filter out unwanted enum values before rendering.
- **Storage persistence** — auto-save form state to `sessionStorage` or `localStorage`.
- **Type safety** — full TypeScript coverage with generics, `withProps<T>()` for IDE autocompletion.
- **Framework flexibility** — use the core package standalone (Vue 3) or via the Nuxt module.

## Development

```bash
# Build all packages
yarn build

# Watch mode (core library)
yarn workspace introspection-forms dev

# Run the demo
yarn workspace introspection-forms-demo dev

# Type-check
yarn workspace introspection-forms typecheck
```

## Repository Structure

```
introspection-forms/
├── packages/
│   ├── introspection-forms/       Core library
│   │   ├── src/
│   │   │   ├── types.ts           Type definitions
│   │   │   ├── codegen/           GraphQL Codegen plugin
│   │   │   ├── composables/       useIntrospectionForm, useEnumFilter
│   │   │   ├── components/        IntrospectionForm.vue, IntrospectionField.vue
│   │   │   ├── plugin/            Vue plugin (global defaults)
│   │   │   └── utils/             convert, storage, withProps, findFieldConfiguration
│   │   └── tsup.config.ts
│   ├── nuxt-introspection-forms/  Nuxt module
│   │   └── src/
│   │       ├── module.ts          Module definition
│   │       └── runtime/           Plugins and composable re-exports
│   └── demo/                      Standalone Vue 3 demo
│       └── src/
│           ├── schema/            Local GraphQL schema
│           ├── generated/         Pre-generated types and metadata
│           ├── validation/        Local Dryv rules
│           └── components/        Demo form field components
├── package.json                   Workspace root
├── tsconfig.json                  Root TypeScript config
└── yarn.lock
```

## License

MIT
