# introspection-forms

Schema-driven form generation for Vue 3 from GraphQL introspection metadata. A code generator reads your GraphQL schema and produces everything a form needs to render — field metadata, type information, default values, and a factory function.

## Installation

```bash
yarn add introspection-forms
yarn add -D @graphql-codegen/cli graphql
```

## Setup

### 1. Configure GraphQL Codegen

Create a `codegen.config.ts` (or add to your existing config):

```ts
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    // The output path here is only used as a placeholder by codegen CLI.
    // The actual output is controlled by the plugin's `output` config.
    './src/generated/introspection/_placeholder.ts': {
      plugins: ['introspection-forms/codegen'],
      config: {
        // Required: where to write the generated files
        output: './src/generated/introspection',

        // Optional: import path for the IntrospectionType interface
        // Default: 'introspection-forms'
        introspectionTypeImport: 'introspection-forms',

        // Optional: import path for your generated GraphQL TypeScript types
        // Default: '../types'
        typesImport: '../graphql-types',

        // Optional: prefix for generated const names (default: 'TypeOf')
        filePrefix: 'TypeOf',

        // Optional: format with prettier (default: true)
        prettier: true,
      },
    },
  },
}

export default config
```

Run the generator:

```bash
npx graphql-codegen
```

This produces one file per input type:

```
src/generated/introspection/
├── TypeOfContactFormInput.ts
├── TypeOfAddressInput.ts
├── TypeOfPaymentInput.ts
└── index.ts
```

### 2. Install the Vue Plugin

```ts
import { createApp } from 'vue'
import { IntrospectionFormsPlugin } from 'introspection-forms/plugin'
import { FormInput, FormCheckbox, FormRadio, FormSelect, FormTextarea } from './my-components'

const app = createApp(App)

app.use(IntrospectionFormsPlugin, {
  defaults: {
    // Map TypeScript types to components
    byFieldType: {
      string: { component: FormInput },
      number: { component: FormInput },
      boolean: { component: FormCheckbox },
      enum: (introspection) => ({
        component: FormRadio,
        props: {
          options: () => introspection.enumValues.map(v => ({ value: v, label: v })),
        },
      }),
    },

    // Map GraphQL types to components
    byOriginalType: {
      DateTime: { component: FormInput, props: { type: 'date' } },
    },

    // Match field names by regex
    byFieldName: [
      { regexp: /^email/i, config: { component: FormInput, props: { type: 'email' } } },
      { regexp: /phone/i, config: { component: FormInput, props: { type: 'tel' } } },
      { regexp: /^(body|message)/i, config: { component: FormTextarea } },
    ],
  },
})
```

### 3. Provide a Translation Function (Optional)

```ts
import { provideTranslate } from 'introspection-forms/plugin'
import { useI18n } from 'vue-i18n'

// In your app setup or plugin:
const { t } = useI18n()
provideTranslate(app, t)
```

## Usage

### Basic Form

```ts
import { ref } from 'vue'
import { useIntrospectionForm } from 'introspection-forms'
import { TypeOfContactFormInput } from './generated/introspection'

const data = ref(TypeOfContactFormInput.create())

const form = useIntrospectionForm(TypeOfContactFormInput, {
  firstName: true,
  lastName: true,
  emailAddress: true,
  body: true,
})
```

```vue
<template>
  <IntrospectionForm :form="form" :model="data">
    <button @click.prevent="submit">Send</button>
  </IntrospectionForm>
</template>
```

### With Validation

Pass a validation rule set as the second argument:

```ts
const form = useIntrospectionForm(
  TypeOfContactFormInput,
  ContactFormValidationRules,  // e.g. from Dryv or any validation library
  {
    firstName: true,
    lastName: true,
    emailAddress: true,
  },
)
```

### Dynamic Fields

Configuration properties accept functions for reactive behavior:

```ts
const form = useIntrospectionForm(TypeOfContactFormInput, {
  isCustomer: {
    component: FormRadio,
    props: {
      options: () => [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ],
    },
  },
  contractNumber: {
    visible: model => model.isCustomer === true,
    span: 3,
  },
})
```

### Nested Forms

```ts
const form = useIntrospectionForm(TypeOfOrderInput, {
  shippingAddress: {
    form: useIntrospectionForm(TypeOfAddressInput, {
      street: true,
      city: true,
      zipCode: true,
    }),
  },
})
```

### Type-Safe Props with `withProps`

```ts
import { withProps } from 'introspection-forms'

const form = useIntrospectionForm(TypeOfContactFormInput, {
  email: {
    component: FormInput,
    props: withProps<typeof FormInput>(() => ({
      type: 'email',
      placeholder: 'you@example.com',
    })),
  },
})
```

## API Reference

### Types

- `IntrospectionType<TModel>` — Generated metadata for a GraphQL input type
- `IntrospectionField` — Metadata for a single field
- `FormConfig<TModel>` — Form configuration object
- `FormRuntime<TModel>` — Processed runtime form configuration
- `FieldConfiguration` — Per-field configuration
- `IntrospectionFormsDefaults` — Global component mapping defaults
- `ValidatableField` — Interface for validation-aware field binding

### Composables

- `useIntrospectionForm(introspection, [rules], config)` — Create a form runtime
- `useIntrospectionFormsEnumFilter()` — Access enum filtering

### Components

- `<IntrospectionForm>` — Renders a form from a FormRuntime
- `<IntrospectionField>` — Renders a single field (used internally)

### Plugin

- `IntrospectionFormsPlugin` — Vue plugin for global configuration
- `provideTranslate(app, t)` — Provide a custom translation function

### Codegen

- `introspection-forms/codegen` — GraphQL Codegen plugin

## Configuration Resolution Order

When determining which component to use for a field:

1. **Field-specific config** — provided directly in `useIntrospectionForm`
2. **Field name patterns** — `byFieldName` regex matches
3. **GraphQL type** — `byOriginalType` matches
4. **TypeScript type** — `byFieldType` matches

## License

MIT
