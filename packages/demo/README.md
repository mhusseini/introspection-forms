# @softwareproduction/introspection-forms-demo

Standalone Vue 3 demo application showcasing a complex multi-section registration form powered by `@softwareproduction/introspection-forms` with local Dryv validation rules — no backend required.

## Table of Contents

- [What This Demonstrates](#what-this-demonstrates)
- [Running the Demo](#running-the-demo)
- [Project Structure](#project-structure)
- [The Form](#the-form)
- [GraphQL Schema](#graphql-schema)
- [Validation Rules](#validation-rules)
- [Component Mapping](#component-mapping)
- [Regenerating Introspection Types](#regenerating-introspection-types)

## What This Demonstrates

- **Schema-driven form generation** — the form structure is derived from a local GraphQL schema, not hand-coded templates.
- **Local Dryv validation** — all validation rules are defined as plain TypeScript files; they execute entirely client-side with no server round-trips.
- **Conditional fields** — company name and annual income appear/hide based on employment status; phone becomes required when "Phone" is the preferred contact method.
- **Nested forms** — the address section uses a separate `AddressInput` type with its own validation rule set.
- **Enum filtering** — the "None" salutation value is filtered out before rendering radio buttons.
- **Reactive debug panel** — a sidebar shows the live model state and validation errors as JSON.
- **Component mapping via plugin** — a single `IntrospectionFormsPlugin` config maps scalar types, GraphQL types, and field name patterns to Vue components.

## Running the Demo

```bash
# From the workspace root:
yarn workspace @softwareproduction/introspection-forms-demo dev

# Or from this directory:
yarn dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
packages/demo/
├── index.html                    Vite entry point
├── vite.config.ts                Vite + Vue plugin
├── codegen.config.ts             GraphQL Codegen config (for regeneration)
├── src/
│   ├── main.ts                   App bootstrap, Dryv + IntrospectionForms plugin setup
│   ├── App.vue                   Main form UI (7 sections, debug panel)
│   ├── schema/
│   │   └── schema.graphql        Local GraphQL schema (enums + input types)
│   ├── generated/
│   │   ├── graphql-types.ts      TypeScript types from the schema
│   │   └── introspection/        Generated IntrospectionType metadata
│   │       ├── TypeOfAddressInput.ts
│   │       ├── TypeOfRegistrationFormInput.ts
│   │       └── index.ts
│   ├── validation/
│   │   ├── RegistrationFormRules.ts   Dryv rules for the main form (9 validated fields)
│   │   └── AddressRules.ts            Dryv rules for the nested address form
│   └── components/
│       ├── FormInput.vue          Text/number/email/tel input
│       ├── FormCheckbox.vue       Checkbox
│       ├── FormRadio.vue          Radio group
│       ├── FormSelect.vue         Select dropdown
│       ├── FormTextarea.vue       Textarea
│       └── FormDateInput.vue      Native date input
```

## The Form

The registration form includes 17 fields across 7 sections:

| Section | Fields |
|---------|--------|
| **Personal Information** | Salutation (radio), First Name, Last Name, Date of Birth |
| **Contact Details** | Email, Phone, Preferred Contact Method (radio) |
| **Address** | Street, House Number, ZIP Code, City, Country |
| **Billing Address** | "Use same address" checkbox + conditional duplicate fields |
| **Employment** | Employment Status (select), Company Name (conditional), Annual Income (conditional) |
| **Additional Information** | Referral Code, Notes (textarea) |
| **Consent** | Accept Terms (required), Subscribe to Newsletter |

### Conditional Logic

- **Phone field** — required validation activates when "Phone" is selected as preferred contact.
- **Company Name** — visible only when employment status is "Employed" or "Self-Employed".
- **Annual Income** — visible for all statuses except "Student" and "Unemployed".
- **Billing Address** — revealed when "Use same address" is unchecked.

## GraphQL Schema

The schema at `src/schema/schema.graphql` defines:

- 3 enums: `Salutation`, `ContactMethod`, `EmploymentStatus`
- 2 input types: `AddressInput`, `RegistrationFormInput`
- 1 custom scalar: `DateTime`

This schema is the single source of truth for both the TypeScript types and the introspection metadata.

## Validation Rules

Validation rules live in `src/validation/` and follow the `DryvValidationRuleSet` interface from `dryvue`. Each rule is a plain function receiving the model object:

```ts
{
  validate($m: RegistrationFormInput) {
    return !$m.email?.trim()
      ? { type: 'error', text: 'Email address is required.', group: null }
      : null
  },
}
```

### Cross-Field Validation

Several rules depend on other field values:

- `phone` — required only when `preferredContact === 'Phone'`
- `companyName` — required only when `employmentStatus` is `'Employed'` or `'SelfEmployed'`
- `annualIncome` — skipped for students and unemployed applicants
- `dateOfBirth` — must be at least 18 years ago, cannot be in the future

### Validation Behavior

Dryv is configured with `objectValidation: 'afterFirstValidation'`, meaning fields validate on change only after the first form-wide `validate()` call (triggered by clicking "Register").

## Component Mapping

The plugin configuration in `src/main.ts` demonstrates the full mapping API:

```ts
app.use(IntrospectionFormsPlugin, {
  defaults: {
    byFieldType: {
      string: { component: FormInput },
      number: { component: FormInput, props: { type: 'number' } },
      boolean: { component: FormCheckbox },
      enum: (introspection) => ({ component: FormRadio, props: { ... } }),
    },
    byOriginalType: {
      DateTime: { component: FormDateInput },
      Float: { component: FormInput, props: { type: 'number' } },
    },
    byFieldName: [
      { regexp: /^email$/i, config: { component: FormInput, props: { type: 'email' } } },
      { regexp: /phone|telefon/i, config: { component: FormInput, props: { type: 'tel' } } },
      { regexp: /^(notes|body|message)$/i, config: { component: FormTextarea } },
      { regexp: /status$/i, config: { component: FormSelect } },
    ],
    enumFilters: {
      Salutation: (values) => values.filter((v) => v !== 'None'),
    },
  },
})
```

Resolution order: field-specific → `byFieldName` → `byOriginalType` → `byFieldType`.

## Regenerating Introspection Types

If you modify `src/schema/schema.graphql`, regenerate the metadata:

```bash
yarn workspace introspection-forms-demo generate
```

This runs `@graphql-codegen/cli` with the config in `codegen.config.ts` and outputs to `src/generated/introspection/`.

Note: you also need to update `src/generated/graphql-types.ts` — either manually or by adding `@graphql-codegen/typescript` to your generates config (already included in the codegen config).
