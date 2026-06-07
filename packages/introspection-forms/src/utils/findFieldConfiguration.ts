import type {
  FieldConfiguration,
  FormsDefaultsFnOrRecord,
  IntrospectionField,
  IntrospectionFormsDefaults,
  Translate,
} from '../types'

/**
 * Finds the best matching field configuration from the global defaults.
 * Resolution order: byFieldName (regex) → byOriginalType → byFieldType.
 */
export function findFieldConfiguration(
  defaults: IntrospectionFormsDefaults | undefined,
  introspection: IntrospectionField,
  t: Translate,
): Partial<FieldConfiguration> | undefined {
  if (!defaults || !introspection) {
    return undefined
  }
  return (
    findConfigByFieldName(defaults, introspection, t) ??
    findBy(defaults.byOriginalType, introspection.originalType, introspection, t) ??
    findBy(defaults.byFieldType, introspection.type, introspection, t)
  )
}

function findBy(
  defaults: Record<string, FormsDefaultsFnOrRecord<Partial<FieldConfiguration>>> | undefined,
  key: string,
  introspection: IntrospectionField,
  t: Translate,
): Partial<FieldConfiguration> | undefined {
  if (!defaults) {
    return undefined
  }
  const configOrFn = defaults[key]
  return typeof configOrFn === 'function' ? configOrFn(introspection, t) : configOrFn
}

function findConfigByFieldName(
  defaults: IntrospectionFormsDefaults,
  introspection: IntrospectionField,
  t: Translate,
): Partial<FieldConfiguration> | undefined {
  if (!defaults.byFieldName) {
    return undefined
  }
  const fieldName = introspection.name
  const configOrFn = defaults.byFieldName.find(f => f.regexp.test(fieldName))?.config
  return typeof configOrFn === 'function' ? configOrFn(introspection, t) : configOrFn
}
