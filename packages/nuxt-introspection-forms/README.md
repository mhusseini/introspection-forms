# nuxt-introspection-forms

Nuxt module that wraps [introspection-forms](../introspection-forms) for seamless integration with Nuxt 3/4 applications. Provides auto-imports, component registration, and module-level configuration.

## Installation

```bash
yarn add nuxt-introspection-forms introspection-forms
```

## Setup

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

## Configure Component Mapping

Create a plugin to provide the component mapping:

```ts
// app/plugins/configure-forms.ts
import { FormInput, FormCheckbox, FormRadio, FormSelect, FormTextarea } from '#components'
import type { IntrospectionFormsDefaults, IntrospectionField } from 'introspection-forms'
import { withProps, useIntrospectionFormsEnumFilter } from 'introspection-forms'

export default defineNuxtPlugin(nuxtApp => {
  const { filterEnumValues } = useIntrospectionFormsEnumFilter()

  nuxtApp.provide('introspection-forms', {
    byFieldType: {
      string: { component: FormInput },
      number: { component: FormInput },
      boolean: { component: FormCheckbox },
      enum: (introspection: IntrospectionField) => ({
        component: FormRadio,
        props: withProps<typeof FormRadio>(() => ({
          options: (_, t) =>
            filterEnumValues(introspection).map(value => ({
              value,
              label: t(`forms.${introspection.originalType}.${value}`),
            })),
        })),
      }),
    },
    byOriginalType: {
      DateTime: { component: FormInput, props: { type: 'date' } },
    },
    byFieldName: [
      { regexp: /^email/i, config: { component: FormInput, props: { type: 'email' } } },
      { regexp: /phone|telefon/i, config: { component: FormInput, props: { type: 'tel' } } },
      { regexp: /^(body|message)/i, config: { component: FormTextarea } },
      { regexp: /files/i, config: { component: FormInput, props: { type: 'file', multiple: true } } },
    ],
    enumFilters: {
      // Filter out 'None' from Salutation enum
      Salutation: values => values.filter(v => v !== 'None'),
    },
  } satisfies IntrospectionFormsDefaults)
})
```

## Usage

The module auto-imports `useIntrospectionForm` and `useIntrospectionFormsEnumFilter`, and globally registers `<IntrospectionForm>` and `<IntrospectionField>` components.

```vue
<script setup lang="ts">
import { TypeOfContactFormInput } from '#introspection-types'

const data = ref(TypeOfContactFormInput.create())

const form = useIntrospectionForm(TypeOfContactFormInput, {
  firstName: true,
  lastName: true,
  emailAddress: true,
  body: true,
})
</script>

<template>
  <IntrospectionForm :form="form" :model="data">
    <Button @click.prevent="submit">Send</Button>
  </IntrospectionForm>
</template>
```

## GraphQL Codegen Integration

Set up the codegen plugin in your project:

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
      },
    },
  },
}

export default config
```

Add a script to your `package.json`:

```json
{
  "scripts": {
    "gen:forms": "graphql-codegen --config codegen.config.ts"
  }
}
```

## Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generatedPath` | `string` | `'types/generated/introspection'` | Path to generated introspection files |
| `defaults` | `IntrospectionFormsDefaults` | `undefined` | Static component mapping (for simple cases) |

## Aliases

The module provides:

- `#introspection-types` → resolves to your `generatedPath` folder
- `#introspection-forms` → resolves to the `introspection-forms` package

## License

MIT
