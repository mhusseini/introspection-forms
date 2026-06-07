# introspection-forms

Schema-driven form generation for Vue 3 from GraphQL or OpenAPI introspection metadata. A code generator reads your GraphQL schema or OpenAPI specification and produces TypeScript metadata for every input/schema type — field types, nullability, enum values, defaults, and a factory function. At runtime, a composable turns that metadata into a fully reactive form with automatic component resolution, validation integration, and conditional logic.

## Table of Contents

- [Installation](#installation)
- [How It Works](#how-it-works)
- [Setup](#setup)
  - [1a. Code Generation (GraphQL)](#1a-code-generation-graphql)
  - [1b. Code Generation (OpenAPI)](#1b-code-generation-openapi)
  - [2. Vue Plugin](#2-vue-plugin)
  - [3. Translation (Optional)](#3-translation-optional)
- [Usage](#usage)
  - [Basic Form](#basic-form)
  - [With Validation](#with-validation)
  - [Validation and Reset via v-model](#validation-and-reset-via-v-model)
  - [Built-in Dryv Integration](#built-in-dryv-integration)
  - [Dependent Forms](#dependent-forms)
  - [Dirty Tracking and Loaded State](#dirty-tracking-and-loaded-state)
  - [Dynamic / Conditional Fields](#dynamic--conditional-fields)
  - [Nested Forms](#nested-forms)
  - [Type-Safe Props](#type-safe-props-with-withprops)
  - [Emits (Event Handlers)](#emits-event-handlers)
  - [Enum Filtering](#enum-filtering)
  - [Storage Persistence](#storage-persistence)
- [Component Mapping](#component-mapping)
  - [Resolution Order](#resolution-order)
  - [Static vs. Dynamic Defaults](#static-vs-dynamic-defaults)
- [Codegen Plugin Configuration](#codegen-plugin-configuration)
- [OpenAPI Codegen Configuration](#openapi-codegen-configuration)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [License](#license)

## Installation

```bash
# Core package
yarn add introspection-forms

# Code generation from GraphQL (dev dependency)
yarn add -D @graphql-codegen/cli graphql

# Code generation from OpenAPI (dev dependency, pick one or both)
yarn add -D yaml   # only needed if your OpenAPI spec is YAML

# Optional: validation
yarn add dryvjs dryvue

# Optional: prettier for formatted output
yarn add -D prettier
```

Peer dependencies: `vue >= 3.4`, `graphql >= 16`. Optional peer dependencies: `dryvjs >= 1.0`, `dryvue >= 2.0` (for validation), `yaml >= 2.0` (for YAML OpenAPI specs).

## How It Works

```
┌──────────────────┐       codegen       ┌─────────────────────────┐
│  GraphQL Schema  │ ──────────────────▶ │  TypeOfXxxInput.ts      │
│  (input types)   │                     │  (IntrospectionType<T>) │
└──────────────────┘                     └────────────┬────────────┘
                                                      │
┌──────────────────┐   generateFromOpenApi            │
│  OpenAPI Spec    │ ──────────────────▶              │
│  (schemas)       │                                  │
└──────────────────┘                                  ▼
                                         ┌─────────────────────────┐
                                         │  useIntrospectionForm() │
                                         │  + component mapping    │
                                         │  + validation rules     │
                                         └────────────┬────────────┘
                                                      │
                                                      ▼
                                         ┌─────────────────────────┐
                                         │  <IntrospectionForm>    │
                                         │  <IntrospectionField>   │
                                         └─────────────────────────┘
```

1. Define your data model as a GraphQL `input` type **or** an OpenAPI schema.
2. Run the codegen plugin (GraphQL) or `generateFromOpenApi()` (OpenAPI) — it produces one TypeScript file per type, each exporting an `IntrospectionType<T>` constant.
3. In your Vue app, call `useIntrospectionForm()` with the generated metadata, optional validation rules, and per-field config.
4. Render with `<IntrospectionForm>` — components are resolved automatically from the global plugin configuration.

## Setup

### 1a. Code Generation (GraphQL)

Create a `codegen.config.ts`:

```ts
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    // The key here is a placeholder — the plugin writes to `config.output` instead.
    './src/generated/introspection/_placeholder.ts': {
      plugins: ['introspection-forms/codegen'],
      config: {
        // Required: output directory for generated files
        output: './src/generated/introspection',

        // Optional: where the IntrospectionType interface is imported from
        // Default: 'introspection-forms'
        introspectionTypeImport: 'introspection-forms',

        // Optional: import path for the GraphQL TypeScript types
        // Default: '../types'
        typesImport: '../graphql-types',

        // Optional: prefix for the exported const names
        // Default: 'TypeOf'
        filePrefix: 'TypeOf',

        // Optional: format with prettier
        // Default: true
        prettier: true,
      },
    },
  },
}

export default config
```

Run it:

```bash
npx graphql-codegen
```

Output:

```
src/generated/introspection/
├── TypeOfContactFormInput.ts
├── TypeOfAddressInput.ts
├── TypeOfPaymentInput.ts
└── index.ts              ← barrel re-exporting all types
```

Each generated file looks like:

```ts
import type { IntrospectionType } from 'introspection-forms'
import { type ContactFormInput } from '../graphql-types'

export const TypeOfContactFormInput: IntrospectionType<ContactFormInput> = {
  name: 'ContactFormInput',
  fields: [
    { name: 'firstName', type: 'string', originalType: 'String', isNullable: false, isEnum: false, ... },
    { name: 'email', type: 'string', originalType: 'String', isNullable: false, isEnum: false, ... },
    // ...
  ],
  create(defaults?: Partial<ContactFormInput>): ContactFormInput {
    return { firstName: '', email: '', ...(defaults || {}) } as ContactFormInput
  },
}
```

### 1b. Code Generation (OpenAPI)

Use `generateFromOpenApi()` to generate introspection metadata from an OpenAPI 3.x or Swagger 2.x specification. The source can be a local file (JSON or YAML) or a remote URL.

#### From a local file

Create a script (e.g. `scripts/generate-forms.ts`):

```ts
import { generateFromOpenApi } from 'introspection-forms/openapi'

await generateFromOpenApi({
  source: './openapi.yaml',
  output: './src/generated/introspection',
  typesImport: '../api-types',
})
```

Run it with `tsx` or any TypeScript runner:

```bash
npx tsx scripts/generate-forms.ts
```

#### From a remote URL

```ts
import { generateFromOpenApi } from 'introspection-forms/openapi'

await generateFromOpenApi({
  source: 'https://petstore3.swagger.io/api/v3/openapi.json',
  output: './src/generated/introspection',
})
```

#### Filtering schemas

```ts
await generateFromOpenApi({
  source: './openapi.yaml',
  output: './src/generated/introspection',
  // Only generate for schemas matching these patterns
  include: [/Input$/, 'CreateUserRequest'],
  // Skip internal schemas
  exclude: [/^Internal/],
})
```

#### Output

The output structure is identical to the GraphQL codegen:

```
src/generated/introspection/
├── TypeOfCreateUserRequest.ts
├── TypeOfUpdateUserRequest.ts
├── TypeOfAddress.ts
└── index.ts              ← barrel re-exporting all types
```

Each generated file:

```ts
import type { IntrospectionType } from 'introspection-forms'
import type { CreateUserRequest } from '../api-types'

export const TypeOfCreateUserRequest: IntrospectionType<CreateUserRequest> = {
  name: 'CreateUserRequest',
  fields: [
    { name: 'firstName', type: 'string', originalType: 'string', isNullable: false, isEnum: false, ... },
    { name: 'role', type: 'enum', originalType: 'enum', isNullable: true, isEnum: true, enumValues: ['admin', 'user'], ... },
    // ...
  ],
  create(defaults?: Partial<CreateUserRequest>): CreateUserRequest {
    return { firstName: '', role: 'admin', ...(defaults || {}) } as CreateUserRequest
  },
}
```

### 2. Vue Plugin

Register the plugin to configure which components render which field types:

```ts
import { createApp } from 'vue'
import { IntrospectionFormsPlugin } from 'introspection-forms/plugin'
import IntrospectionForm from 'introspection-forms/components/IntrospectionForm.vue'
import IntrospectionField from 'introspection-forms/components/IntrospectionField.vue'
import { FormInput, FormCheckbox, FormRadio, FormSelect, FormTextarea } from './my-components'

const app = createApp(App)

app.use(IntrospectionFormsPlugin, {
  // Optionally register the built-in components globally
  components: { IntrospectionForm, IntrospectionField },

  // Optional: provide a translation function for label resolution
  translate: (key) => i18n.global.t(key),

  defaults: {
    byFieldType: {
      string: { component: FormInput },
      number: { component: FormInput, props: { type: 'number' } },
      boolean: { component: FormCheckbox },
      enum: (introspection) => ({
        component: FormRadio,
        props: {
          options: () => introspection.enumValues.map(v => ({ value: v, label: v })),
        },
      }),
    },
    byOriginalType: {
      DateTime: { component: FormInput, props: { type: 'date' } },
    },
    byFieldName: [
      { regexp: /^email/i, config: { component: FormInput, props: { type: 'email' } } },
      { regexp: /phone|telefon/i, config: { component: FormInput, props: { type: 'tel' } } },
      { regexp: /^(body|message|notes)/i, config: { component: FormTextarea } },
    ],
    enumFilters: {
      Salutation: values => values.filter(v => v !== 'None'),
    },
  },
})
```

### 3. Translation (Optional)

Provide a translation function so labels and enum values can be localized. Pass it as the `translate` option when installing the plugin:

```ts
app.use(IntrospectionFormsPlugin, {
  translate: (key) => i18n.global.t(key),
  defaults: { /* ... */ },
})
```

#### How label resolution works

When a field does not have an explicit `label` configured, the component builds a translation key automatically and passes it to the `translate` function:

```
<translationPrefix><TypeName>.<fieldName>
```

For example, given a type `ContactFormInput` with a field `firstName`, the generated key is `forms.ContactFormInput.firstName`.

- **With a `translate` function** — the key is passed to your translator, which can return a localized string (e.g. `"First Name"` or `"Vorname"`).
- **Without a `translate` function** — the raw key string is used as the label directly (e.g. `"forms.ContactFormInput.firstName"`).

#### Configuring the prefix

The `translationPrefix` option controls the prefix prepended to the auto-generated key. It defaults to `'forms.'`. You can change it or disable it entirely:

```ts
// Custom prefix — keys become "labels.ContactFormInput.firstName"
app.use(IntrospectionFormsPlugin, {
  translate: (key) => i18n.global.t(key),
  translationPrefix: 'labels.',
})

// No prefix — keys become "ContactFormInput.firstName"
app.use(IntrospectionFormsPlugin, {
  translate: (key) => i18n.global.t(key),
  translationPrefix: '',
})
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
  email: true,
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

Pass a [Dryv](https://github.com/mhusseini/dryvjs) validation rule set as the second argument to `useIntrospectionForm`. The form's `rules` are stored in the `FormRuntime` and can be picked up by `<IntrospectionForm>` for automatic validation integration.

There are two ways to set up validation: **external** (you manage the Dryv session yourself) and **built-in** (the component creates it internally). In both cases, `<IntrospectionForm>` wires the validatable proxy to each field automatically, providing inline error messages via each field's `validatable.text` property.

#### External Dryv Session

Create the Dryv session yourself and pass the `validatable` object as a prop:

```ts
import { reactive, ref } from 'vue'
import { useDryv } from 'dryvue'
import { useIntrospectionForm } from 'introspection-forms'
import { TypeOfContactFormInput } from './generated/introspection'
import { ContactFormValidationSet } from './validation/ContactFormRules'

const model = reactive(TypeOfContactFormInput.create())
const { validatable, validate } = useDryv(model, ContactFormValidationSet)

const form = useIntrospectionForm(TypeOfContactFormInput, ContactFormValidationSet, {
  firstName: true,
  lastName: true,
  email: true,
})
```

```vue
<template>
  <IntrospectionForm :form="form" :model="model" :validatable="validatable">
    <button @click.prevent="validate">Submit</button>
  </IntrospectionForm>
</template>
```

This gives you full control over the Dryv session — you can call `validate()`, `reset()`, `revert()`, and access `dirty`, `valid`, etc. directly.

### Validation and Reset via v-model

`<IntrospectionForm>` exposes `validate` and `reset` functions via `v-model`, allowing the parent to trigger validation and reset without managing the Dryv session directly:

```ts
const validate = ref<(checkOnly?: boolean) => Promise<boolean>>()
const reset = ref<() => void>()
```

```vue
<template>
  <IntrospectionForm
    :form="form"
    :model="model"
    v-model:validate="validate"
    v-model:reset="reset"
  >
    <button @click="validate?.()">Submit</button>
    <button @click="reset?.()">Reset</button>
  </IntrospectionForm>
</template>
```

The `validate` function returns a `Promise<boolean>` — `true` if validation passed, `false` otherwise. It also accepts an optional `checkOnly` parameter: when `true`, the validation result is returned but the form state is immediately reset (useful for pre-flight checks). On successful validation, the component syncs the inner model back to `props.model` and persists to storage (if configured).

The `reset` function calls Dryv's `revert()` (undo field changes) and `reset()` (clear validation state).

### Built-in Dryv Integration

When `form.rules` is set and no external `validatable` is passed, the component creates a Dryv session internally. This is the simplest setup — validation is fully managed by the component:

```ts
const model = reactive(TypeOfContactFormInput.create())

const form = useIntrospectionForm(TypeOfContactFormInput, ContactFormValidationSet, {
  firstName: true,
  lastName: true,
  email: true,
})

const validate = ref<(checkOnly?: boolean) => Promise<boolean>>()
```

```vue
<template>
  <!-- Suspense is required when using built-in Dryv (the component uses top-level await) -->
  <Suspense>
    <IntrospectionForm
      :form="form"
      :model="model"
      v-model:validate="validate"
    >
      <button @click="validate?.()">Submit</button>
    </IntrospectionForm>
  </Suspense>
</template>
```

The component dynamically imports `dryvue` at mount time. If `dryvue` is not installed, the component falls back to a no-validation proxy — all fields remain editable and `validate()` always returns `true`.

> **Note:** Because the component uses a top-level `await` for the dynamic import, it must be wrapped in `<Suspense>`. In Nuxt, all components are wrapped in Suspense automatically.

### Dependent Forms

Nested sub-forms that share their parent's validation lifecycle use the `dependent` prop. A dependent form passes the parent's validatable object as its model and cannot be validated independently:

```vue
<IntrospectionForm
  as="div"
  :form="addressForm"
  :model="parentValidatable"
  dependent
/>
```

This is used internally by `<IntrospectionField>` when rendering nested forms (e.g. an address sub-form inside a registration form). You typically don't need to use `dependent` directly — it's set automatically for nested `form` configurations.

### Dirty Tracking and Loaded State

The component exposes additional reactive state via `v-model`:

```vue
<IntrospectionForm
  :form="form"
  :model="model"
  v-model:dirty="isDirty"
  v-model:loaded="isLoaded"
  v-model:el="formElement"
  v-model:parameters="dryvParameters"
/>
```

```ts
const isDirty = ref(false)         // true when any field has been modified
const isLoaded = ref(false)        // true after storage data has been loaded
const formElement = ref<HTMLElement>()  // the root DOM element
const dryvParameters = ref<object>()   // Dryv validation parameters
```

### Dynamic / Conditional Fields

Configuration properties accept functions that receive the current model and a translation function:

```ts
const form = useIntrospectionForm(TypeOfRegistrationInput, {
  isCustomer: {
    component: FormRadio,
    props: {
      options: () => [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ],
    },
  },
  // Only visible when isCustomer is true
  contractNumber: {
    visible: model => model.isCustomer === true,
    span: 2,
  },
  // Dynamic label
  email: {
    label: model => model.isCustomer ? 'Contract Email' : 'Email Address',
  },
  // Conditionally disabled
  phone: {
    disabled: model => model.preferredContact !== 'Phone',
  },
})
```

### Nested Forms

For fields that are themselves complex objects (e.g. an address within a registration form):

```ts
const addressForm = useIntrospectionForm(TypeOfAddressInput, {
  street: true,
  houseNumber: true,
  zipCode: true,
  city: true,
})

const form = useIntrospectionForm(TypeOfRegistrationInput, {
  firstName: true,
  lastName: true,
  address: { form: addressForm },
})
```

The `<IntrospectionField>` component detects the nested form and recursively renders it.

### Type-Safe Props with `withProps`

Get full IDE autocompletion for the props of the component you're configuring:

```ts
import { withProps } from 'introspection-forms'

const form = useIntrospectionForm(TypeOfContactFormInput, {
  email: {
    component: FormInput,
    props: withProps<typeof FormInput>(() => ({
      type: 'email',
      placeholder: 'you@example.com',
      autocomplete: 'email',
    })),
  },
})
```

### Emits (Event Handlers)

React to value changes from within the form configuration:

```ts
const form = useIntrospectionForm(TypeOfFormInput, {
  acceptTerms: {
    emits: {
      'update:modelValue': (model, t, newValue) => {
        if (newValue) scrollToNextSection()
      },
    },
  },
})
```

Each handler receives `(model, translateFn, ...eventArgs)`.

### Enum Filtering

Filter out specific enum values globally via `enumFilters`:

```ts
// In plugin config:
enumFilters: {
  Salutation: values => values.filter(v => v !== 'None'),
  Country: values => values.filter(v => allowedCountries.includes(v)),
}
```

When building custom field components, use `useIntrospectionFormsEnumFilter` to retrieve the filtered values for a given field. This ensures your select/dropdown options respect the global filter configuration:

```ts
const { filterEnumValues } = useIntrospectionFormsEnumFilter()
const options = filterEnumValues(fieldIntrospection) // filtered string[]
```

### Storage Persistence

The `<IntrospectionForm>` component can persist form state to `sessionStorage` or `localStorage`:

```vue
<IntrospectionForm
  :form="form"
  :model="data"
  storage="session"
  :interceptStorage="(saved) => ({ ...saved, acceptTerms: false })"
>
  ...
</IntrospectionForm>
```

Options: `'session'` (default), `'local'`, `'none'`, or `boolean`.

## Component Mapping

The plugin's `defaults` object defines how fields are automatically mapped to Vue components.

### Resolution Order

When determining which component to render for a given field:

1. **Field-specific config** — provided directly in `useIntrospectionForm(..., { fieldName: { component } })`
2. **Field name patterns** — first matching `byFieldName` regex entry
3. **Original GraphQL type** — `byOriginalType[field.originalType]`
4. **TypeScript scalar type** — `byFieldType[field.type]`

Field-specific config merges with (rather than fully replaces) the resolved defaults. This means you can override only `span` or `label` while keeping the auto-resolved component.

### Static vs. Dynamic Defaults

Defaults can be plain objects or functions:

```ts
byFieldType: {
  // Static — same config for every string field
  string: { component: FormInput },

  // Dynamic — the function receives the IntrospectionField and can return different configs
  enum: (field) => ({
    component: field.enumValues.length > 5 ? FormSelect : FormRadio,
    props: { options: () => field.enumValues.map(v => ({ value: v, label: v })) },
  }),
}
```

## Codegen Plugin Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `output` | `string` | — (required) | Directory for generated TypeScript files |
| `introspectionTypeImport` | `string` | `'introspection-forms'` | Import path for the `IntrospectionType` interface |
| `typesImport` | `string` | `'../types'` | Import path for the generated GraphQL types |
| `filePrefix` | `string` | `'TypeOf'` | Prefix for generated const and file names |
| `prettier` | `boolean` | `true` | Format output with prettier |

## OpenAPI Codegen Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | `string` | — (required) | Path to a local OpenAPI file (JSON/YAML) or a URL |
| `output` | `string` | — (required) | Directory for generated TypeScript files |
| `introspectionTypeImport` | `string` | `'introspection-forms'` | Import path for the `IntrospectionType` interface |
| `typesImport` | `string` | `undefined` | Import path for generated types. If unset, inline types are used |
| `filePrefix` | `string` | `'TypeOf'` | Prefix for generated const and file names |
| `prettier` | `boolean` | `true` | Format output with prettier |
| `include` | `(string \| RegExp)[]` | `undefined` | Only generate schemas matching these patterns |
| `exclude` | `(string \| RegExp)[]` | `undefined` | Skip schemas matching these patterns |

## API Reference

### Exports from `introspection-forms`

| Export | Kind | Description |
|--------|------|-------------|
| `useIntrospectionForm` | composable | Creates a `FormRuntime` from introspection metadata |
| `useIntrospectionFormsEnumFilter` | composable | Access registered enum filters |
| `withProps` | utility | Type-safe prop helper for field configuration |
| `convert` | utility | Value type conversion (string → number/boolean) |
| `findFieldConfiguration` | utility | Resolve defaults for a field |
| `readStorage` / `writeStorage` / `clearStorage` | utility | Browser storage helpers |
| `IntrospectionFormsPlugin` | Vue plugin | Global configuration and component registration |
| `provideTranslate` | function | *(deprecated)* Provide a custom translation function — use the `translate` plugin option instead |
| `INTROSPECTION_FORMS_KEY` | InjectionKey | For advanced provide/inject usage |

### Exports from `introspection-forms/codegen`

| Export | Kind | Description |
|--------|------|-------------|
| `plugin` | function | The GraphQL Codegen plugin entry point |
| `default` | CodegenPlugin | Default export for codegen CLI integration |

### Exports from `introspection-forms/openapi`

| Export | Kind | Description |
|--------|------|-------------|
| `generateFromOpenApi` | function | Generate introspection metadata from an OpenAPI spec |
| `default` | function | Default export (same as `generateFromOpenApi`) |
| `OpenApiCodegenConfig` | type | Configuration options for the OpenAPI generator |

### Exports from `introspection-forms/components/*`

| Component | Description |
|-----------|-------------|
| `IntrospectionForm.vue` | Top-level form renderer |
| `IntrospectionField.vue` | Individual field renderer (handles nesting, typing proxy, visibility) |

### Key Types

| Type | Source | Description |
|------|--------|-------------|
| `IntrospectionType<T>` | `introspection-forms` | Generated metadata for a schema type (GraphQL or OpenAPI) |
| `IntrospectionField` | `introspection-forms` | Metadata for a single field (name, type, nullability, enum values) |
| `FormConfig<T>` | `introspection-forms` | User-provided form configuration (field → boolean or FieldConfiguration) |
| `FormRuntime<T>` | `introspection-forms` | Processed runtime form configuration passed to components |
| `FieldConfiguration` | `introspection-forms` | Full per-field config (component, props, visible, disabled, span, label, info, emits, form) |
| `FieldRuntime` | `introspection-forms` | Processed field config with all values as functions |
| `ValidatableField` | `introspection-forms` | Minimal validatable field interface (value, text, required) |
| `IntrospectionFormsDefaults` | `introspection-forms` | Global defaults shape (byFieldType, byOriginalType, byFieldName, enumFilters) |
| `Translate` | `introspection-forms` | `(key: string, params?) => string` |
| `DryvValidatableObject<T>` | `dryvjs` | Typed validatable proxy from Dryv. Each property is a `DryvValidatableField`. |
| `DryvValidatableField<T>` | `dryvjs` | A single validatable field with `value`, `text`, `type`, `validate()`, etc. |
| `DryvValidationResult` | `dryvjs` | Result of `validate()` with `success`, `hasErrors`, `hasWarnings`, `hasNewWarnings`. |
| `DryvValidationRuleSet<T>` | `dryvjs` | A named set of validation rules generated by Dryv. |
| `UseDryvResult<T>` | `dryvue` | Return type of `useDryv()` with `validatable`, `model`, `validate`, `dirty`, `reset`, `revert`, etc. |

### `<IntrospectionForm>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `model` | `T` | — | The reactive form data object |
| `form` | `FormRuntime<T>` | — | Form runtime from `useIntrospectionForm` |
| `as` | `string` | `'form'` | HTML element or component to render as the root |
| `columns` | `number` | `2` | Number of grid columns |
| `dependent` | `boolean` | `false` | Mark as a dependent sub-form that shares the parent's validation lifecycle |
| `storage` | `'session' \| 'local' \| 'none' \| boolean` | `'session'` | Persistence strategy |
| `interceptStorage` | `(model: T) => T \| undefined` | — | Transform data loaded from storage |
| `validatable` | `DryvValidatableObject<T>` | — | External Dryv validatable proxy object. When provided, the component uses it directly instead of creating its own Dryv session. |

### `<IntrospectionForm>` v-model Bindings

| Binding | Type | Description |
|---------|------|-------------|
| `v-model:validate` | `(checkOnly?: boolean) => Promise<boolean>` | Receive the validation trigger function. Call it to run Dryv validation. Returns `true` on success. |
| `v-model:reset` | `() => void` | Receive the reset function. Reverts field changes and clears validation state. |
| `v-model:dirty` | `boolean` | `true` when any field has been modified since the last reset. |
| `v-model:loaded` | `boolean` | `true` after the component has finished loading data from storage. |
| `v-model:parameters` | `object` | Dryv validation parameters (e.g. async validation config). |
| `v-model:el` | `HTMLElement` | The root DOM element of the form. |

## Architecture

The package is structured into independent layers:

```
src/
├── types.ts            Core type definitions
├── codegen/            GraphQL Codegen plugin (Node.js, runs at build time)
├── openapi/            OpenAPI codegen (Node.js, runs at build time)
├── composables/        Vue composables (useIntrospectionForm, useEnumFilter)
├── components/         Vue SFCs (IntrospectionForm, IntrospectionField)
├── plugin/             Vue plugin for app.use() registration
└── utils/              Pure utilities (convert, storage, findFieldConfiguration, withProps)
```

- **Codegen** and **OpenAPI** run at build time in Node.js. They have no Vue dependency.
- **Composables and Plugin** use Vue's `inject`/`provide` for configuration.
- **Components** are shipped as `.vue` SFC source files so they are compiled by the consumer's build pipeline. This keeps the package dependency-light and ensures compatibility with any Vue build tooling.

## License

MIT
