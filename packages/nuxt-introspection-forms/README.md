# nuxt-introspection-forms

Nuxt module that wraps [introspection-forms](../introspection-forms) for seamless integration with Nuxt 3 and 4 applications. It handles component registration, composable auto-imports, alias configuration, and global defaults injection — so you can use schema-driven forms with zero boilerplate.

## Table of Contents

- [Installation](#installation)
- [Module Setup](#module-setup)
- [Component Mapping Plugin](#component-mapping-plugin)
- [Usage in Pages & Components](#usage-in-pages--components)
- [GraphQL Codegen Integration](#graphql-codegen-integration)
- [Module Options](#module-options)
- [Provided Aliases](#provided-aliases)
- [Auto-Imports](#auto-imports)
- [Validation with Dryv](#validation-with-dryv)
- [Advanced Configuration](#advanced-configuration)
- [Architecture](#architecture)
- [License](#license)

## Installation

```bash
yarn add nuxt-introspection-forms introspection-forms
yarn add -D @graphql-codegen/cli graphql
```

Peer dependencies: `vue >= 3.4`, `nuxt >= 3.9`.

## Module Setup

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-introspection-forms'],

  introspectionForms: {
    // Path to generated introspection types (relative to rootDir)
    generatedPath: 'types/generated/introspection',
  },
})
```

The module will:

1. Register `<IntrospectionForm>` and `<IntrospectionField>` as global components.
2. Auto-import `useIntrospectionForm` and `useIntrospectionFormsEnumFilter` composables.
3. Create `#introspection-types` and `#introspection-forms` aliases for convenient imports.
4. Register a client-side plugin that provides global defaults via `inject`.

## Component Mapping Plugin

Create a Nuxt plugin to define which UI components render which field types. This is where you connect `introspection-forms` to your design system.

```ts
// app/plugins/configure-forms.ts
import {
  FormInput,
  FormCheckbox,
  FormRadio,
  FormSelect,
  FormTextarea,
  FormDateInput,
} from '#components'
import type { IntrospectionFormsDefaults, IntrospectionField } from 'introspection-forms'
import { withProps, useIntrospectionFormsEnumFilter } from 'introspection-forms'

export default defineNuxtPlugin(nuxtApp => {
  const { filterEnumValues } = useIntrospectionFormsEnumFilter()

  nuxtApp.provide('introspection-forms', {
    // Map by TypeScript scalar type
    byFieldType: {
      string: { component: FormInput },
      number: { component: FormInput, props: { type: 'number' } },
      boolean: { component: FormCheckbox },
      enum: (introspection: IntrospectionField) => ({
        component: introspection.enumValues.length > 5 ? FormSelect : FormRadio,
        props: withProps<typeof FormRadio>(() => ({
          options: (_, t) =>
            filterEnumValues(introspection).map(value => ({
              value,
              label: t(`forms.${introspection.originalType}.${value}`),
            })),
        })),
      }),
    },

    // Map by original GraphQL type name
    byOriginalType: {
      DateTime: { component: FormDateInput },
      Float: { component: FormInput, props: { type: 'number', step: '0.01' } },
    },

    // Map by field name (regex matching, first match wins)
    byFieldName: [
      { regexp: /^email/i, config: { component: FormInput, props: { type: 'email' } } },
      { regexp: /phone|telefon/i, config: { component: FormInput, props: { type: 'tel' } } },
      { regexp: /^(body|message|notes)/i, config: { component: FormTextarea } },
      { regexp: /files/i, config: { component: FormInput, props: { type: 'file', multiple: true } } },
      { regexp: /^(password|passwort)/i, config: { component: FormInput, props: { type: 'password' } } },
    ],

    // Global enum value filters
    enumFilters: {
      Salutation: values => values.filter(v => v !== 'None'),
    },
  } satisfies IntrospectionFormsDefaults)
})
```

## Usage in Pages & Components

The module auto-imports everything you need. Import only the generated introspection type:

```vue
<script setup lang="ts">
import { TypeOfContactFormInput } from '#introspection-types'

const data = ref(TypeOfContactFormInput.create())

const form = useIntrospectionForm(TypeOfContactFormInput, {
  firstName: true,
  lastName: true,
  email: true,
  body: true,
})

async function submit() {
  // data.value now contains the form values
  await $fetch('/api/contact', { method: 'POST', body: data.value })
}
</script>

<template>
  <IntrospectionForm :form="form" :model="data">
    <button @click.prevent="submit">Send</button>
  </IntrospectionForm>
</template>
```

### With Field Overrides

Override defaults for specific fields without losing the auto-resolved component:

```vue
<script setup lang="ts">
import { TypeOfRegistrationFormInput } from '#introspection-types'

const data = ref(TypeOfRegistrationFormInput.create({ useSameAddress: true }))

const form = useIntrospectionForm(TypeOfRegistrationFormInput, {
  firstName: { span: 1 },                           // Keep default component, adjust layout
  lastName: { span: 1 },
  email: true,                                      // Use defaults entirely
  phone: {
    visible: model => model.preferredContact === 'Phone',  // Conditional visibility
  },
  acceptTerms: { span: 2 },
})
</script>
```

### With Nested Forms

```vue
<script setup lang="ts">
import { TypeOfOrderInput, TypeOfAddressInput } from '#introspection-types'

const data = ref(TypeOfOrderInput.create())

const addressForm = useIntrospectionForm(TypeOfAddressInput, {
  street: true,
  houseNumber: true,
  zipCode: true,
  city: true,
})

const form = useIntrospectionForm(TypeOfOrderInput, {
  productId: true,
  quantity: true,
  shippingAddress: { form: addressForm },
})
</script>
```

## GraphQL Codegen Integration

Set up the codegen plugin to generate introspection metadata from your schema:

```ts
// codegen.config.ts
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './types/generated/introspection/_placeholder.ts': {
      plugins: ['introspection-forms/codegen'],
      config: {
        output: './types/generated/introspection',
        typesImport: '../graphql-types',
        introspectionTypeImport: 'introspection-forms',
      },
    },
  },
}

export default config
```

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "gen:forms": "graphql-codegen --config codegen.config.ts",
    "gen:types": "graphql-codegen --config codegen-types.config.ts"
  }
}
```

Run both generators when your schema changes:

```bash
yarn gen:types && yarn gen:forms
```

## Module Options

Configure via `introspectionForms` in `nuxt.config.ts`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generatedPath` | `string` | `'types/generated/introspection'` | Path to generated introspection files (relative to `rootDir`) |
| `defaults` | `IntrospectionFormsDefaults` | `undefined` | Static component mapping defaults (alternative to the plugin approach for simple configs) |

## Provided Aliases

The module registers two aliases for convenient imports:

| Alias | Resolves To | Usage |
|-------|-------------|-------|
| `#introspection-types` | `<rootDir>/<generatedPath>` | `import { TypeOfXxx } from '#introspection-types'` |
| `#introspection-forms` | `introspection-forms` package | `import { withProps } from '#introspection-forms'` |

## Auto-Imports

These are available globally without manual imports:

| Import | Source | Description |
|--------|--------|-------------|
| `useIntrospectionForm` | `introspection-forms` | Create a form runtime |
| `useIntrospectionFormsEnumFilter` | `introspection-forms` | Access enum filters |

Components registered globally:

| Component | Description |
|-----------|-------------|
| `<IntrospectionForm>` | Top-level form renderer |
| `<IntrospectionField>` | Individual field renderer |

## Validation with Dryv

The module integrates with [Dryv](https://github.com/mhusseini/dryvjs) for client-side validation. Pass a `DryvValidationRuleSet` to `useIntrospectionForm` and use `v-model:validate` to receive the validate command from the component:

```vue
<script setup lang="ts">
import { TypeOfContactFormInput } from '#introspection-types'
import { ContactFormValidationSet } from '#validation'

const data = ref(TypeOfContactFormInput.create())
const validate = ref<(checkOnly?: boolean) => Promise<boolean>>()

const form = useIntrospectionForm(
  TypeOfContactFormInput,
  ContactFormValidationSet,
  {
    firstName: true,
    lastName: true,
    email: true,
  },
)

async function submit() {
  const success = await validate.value?.()
  if (!success) return
  await $fetch('/api/submit', { method: 'POST', body: data.value })
}
</script>

<template>
  <IntrospectionForm :form="form" :model="data" v-model:validate="validate">
    <button @click.prevent="submit">Submit</button>
  </IntrospectionForm>
</template>
```

The component internally creates a Dryv validation session when rules are provided and exposes the `validate` function via `v-model:validate`. Validation errors appear inline beneath each field automatically.

## Advanced Configuration

### Multiple Form Configs (Spread Pattern)

Break large forms into logical groups:

```ts
const personalFields = { firstName: true, lastName: true, dateOfBirth: true }
const contactFields = { email: true, phone: true, preferredContact: true }
const consentFields = { acceptTerms: { span: 2 }, acceptNewsletter: { span: 2 } }

const form = useIntrospectionForm(TypeOfRegistrationFormInput, {
  ...personalFields,
  ...contactFields,
  ...consentFields,
})
```

### Form-Level Visibility and Disabled

```ts
const form = useIntrospectionForm({
  introspection: TypeOfPaymentInput,
  config: { cardNumber: true, cvv: true, expiryDate: true },
  visible: model => model.paymentMethod === 'creditCard',
  disabled: model => model.isProcessing,
})
```

### Storage Persistence per Form

```vue
<IntrospectionForm
  :form="form"
  :model="data"
  storage="session"
  :interceptStorage="(stored) => ({ ...stored, acceptTerms: false })"
>
  ...
</IntrospectionForm>
```

## License

MIT
