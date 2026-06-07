import type { Component, Ref } from 'vue'

/**
 * Defines the supported scalar types that can be rendered as form inputs.
 */
export type ScalarType = 'string' | 'number' | 'boolean' | 'date' | 'enum'

/**
 * Provides runtime metadata for a GraphQL input type, generated from the schema.
 */
export interface IntrospectionType<TModel extends object = object> {
  /** The GraphQL name of the input type (e.g., 'CreateUserInput'). */
  name: string
  /** An array of metadata for each field within the input type. */
  fields: IntrospectionField[]
  /**
   * A factory function to create a new model instance with default values.
   * @param defaultValues Optional values to override the schema-defined defaults.
   */
  create(defaultValues?: Partial<TModel> | undefined | null): TModel
}

/**
 * Provides runtime metadata for a single field within a GraphQL input type.
 */
export interface IntrospectionField {
  /** The name of the field (e.g., 'firstName'). */
  name: string
  /** The corresponding TypeScript type of the field (e.g., 'string', 'number'). */
  type: string
  /** The original GraphQL type as defined in the schema (e.g., 'String', 'Int'). */
  originalType: string
  /** True if the field is a list/array type (e.g., '[String]'). */
  isArray: boolean
  /** True if the field is nullable (can be 'null' or 'undefined'). */
  isNullable: boolean
  /** True if the field is an enumeration type. */
  isEnum: boolean
  /** If the field is an enum, this array contains its possible string values. */
  enumValues: string[]
  /** The default value of the field as specified in the GraphQL schema. */
  defaultValue: unknown
}

/**
 * A utility type that transforms an object's properties into values that can be
 * either static or dynamically resolved by a function at runtime.
 */
export type ConfigValue<TComponent, TModel extends object = object> = {
  [K in keyof TComponent]: TComponent[K] | Ref<TComponent[K]> | ((item: TModel, t: Translate) => TComponent[K])
}

/**
 * A utility type that converts an object of properties into an object of functions.
 */
export type RuntimeFunctions<TComponent, TModel extends object = object> = {
  [K in keyof TComponent]: (item?: TModel) => TComponent[K]
}

/**
 * A helper type to infer the props type from a Vue component's constructor.
 */
export type InferComponentProps<TModel> = TModel extends new (...args: unknown[]) => { $props: infer P } ? P : never

/**
 * A utility type to get the props of a Vue component, making them all optional.
 */
export type Props<TComponent extends Component> = Partial<InferComponentProps<TComponent>>

/**
 * Defines the base set of configurable properties for a single form field.
 */
export type FieldBaseConfig<TComponent extends Component = Component> = {
  /** The number of grid columns the field should span in the form layout. */
  span: number
  /** Determines whether the field is interactive or read-only. */
  disabled: boolean
  /** Controls the visibility of the field in the UI. */
  visible: boolean
  /** The Vue component used to render the field's input control. */
  component: TComponent
  /** The field's label. */
  label: string | { component: Component; props?: Record<string, unknown> }
  /** An informational tooltip or helper text displayed with the field. */
  info: string
}

/**
 * Represents the user-defined configuration for a single form field.
 */
export type FieldConfiguration<
  TComponent extends Component = Component,
  TModel = unknown,
  TFieldValue = unknown,
> = ConfigValue<FieldBaseConfig<TComponent>, TModel & object> & {
  /** Optional props to pass directly to the field's Vue component. */
  props?: ConfigValue<Props<TComponent>, TModel & object>
  /** Optional event handlers for the field's component. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emits?: Record<string, (item: TModel, t: Translate, ...args: any[]) => void>
  /** An optional nested form configuration for complex object fields. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form?: FormRuntime<NonNullable<TFieldValue> & object> | FormRuntime<any>
}

/**
 * Defines the overall structure for a form's configuration.
 */
export type FormConfig<TModel extends object> = {
  [K in keyof Partial<TModel>]?: boolean | Partial<FieldConfiguration<Component, TModel, NonNullable<TModel[K]>>>
} & {
  [key: string]: boolean | Partial<FieldConfiguration<Component, TModel>> | undefined
}

/**
 * The processed runtime representation of a field's configuration.
 */
export type FieldRuntime<
  TComponent extends Component = Component,
  TModel = unknown,
  TFieldValue = unknown,
> = RuntimeFunctions<FieldBaseConfig<TComponent>, TModel & object> & {
  /** The name of the field. */
  name: string
  /** The introspection metadata for this field. */
  introspection: IntrospectionField
  /** The resolved props for the field's component. */
  props: RuntimeFunctions<Props<TComponent>, TModel & object>
  /** Event handlers for the field's component. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emits?: Record<string, (item: TModel, t: Translate, ...args: any[]) => void>
  /** A function that returns the optional nested child form's runtime configuration. */
  form?: () => FormRuntime<NonNullable<TFieldValue> & object>
}

/**
 * The runtime representation of a form's complete configuration.
 */
export interface FormRuntime<TModel extends object> {
  /** The introspection metadata for the form's underlying data model. */
  introspection: IntrospectionType<TModel>
  /** The set of validation rules for the form (optional). */
  rules?: unknown
  /** An array containing the runtime configurations for all fields in the form. */
  fields: Partial<FieldRuntime<Component, TModel>>[]
  /** A function to dynamically determine if the entire form should be visible. */
  visible: (item: TModel) => boolean
  /** A function to dynamically determine if the entire form should be disabled. */
  disabled: (item: TModel) => boolean
  /** The runtime-resolved props for the top-level form component. */
  props: Record<string, (item?: TModel) => unknown>
}

/**
 * Defines the signature for a translation function used for localization.
 */
export type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Defines a function that returns a default configuration for a form field.
 */
export type FormsDefaultsFn<TModel> = (introspection: IntrospectionField, t: Translate) => TModel

/**
 * A utility type representing a value that can either be a static configuration
 * object or a function that dynamically returns one.
 */
export type FormsDefaultsFnOrRecord<TModel> = TModel | FormsDefaultsFn<TModel>

/**
 * Defines a function that filters enum values for a given field.
 */
export type IntrospectionFormsEnumFilter = (values: string[]) => string[]

/**
 * Defines the structure for providing global default configurations for form fields.
 */
export interface IntrospectionFormsDefaults {
  /** Default configurations applied based on the field's TypeScript type. */
  byFieldType?: Record<string, FormsDefaultsFnOrRecord<Partial<FieldConfiguration>>>
  /** Default configurations applied based on the field's original GraphQL type. */
  byOriginalType?: Record<string, FormsDefaultsFnOrRecord<Partial<FieldConfiguration>>>
  /** A list of default configurations applied to fields whose names match a regular expression. */
  byFieldName?: {
    regexp: RegExp
    config: FormsDefaultsFnOrRecord<Partial<FieldConfiguration>>
  }[]
  /** A map of filter functions to apply to enum fields. */
  enumFilters?: Record<string, IntrospectionFormsEnumFilter>
}

/**
 * Options for the IntrospectionForms Vue plugin.
 */
export interface IntrospectionFormsPluginOptions {
  /** Global defaults for component resolution. */
  defaults?: IntrospectionFormsDefaults
  /** A custom translation function for label resolution. */
  translate?: Translate
  /**
   * Prefix prepended to auto-generated translation keys for field labels.
   * The final key is `${translationPrefix}<TypeName>.<fieldName>`.
   * Set to an empty string to disable the prefix entirely.
   * @default 'forms.'
   */
  translationPrefix?: string
}

/**
 * Options for the useIntrospectionForm composable (object form).
 */
export interface IntrospectionFormOptions<TModel extends object> {
  introspection: IntrospectionType<TModel>
  rules?: unknown
  config: FormConfig<TModel>
  visible?: (item: TModel) => boolean
  disabled?: (item: TModel) => boolean
  props?: Record<string, unknown>
}

/**
 * A validatable field interface compatible with validation libraries.
 */
export interface ValidatableField {
  value: unknown
  text: string | null
  required?: boolean
}
