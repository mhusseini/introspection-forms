import { isRef, inject } from 'vue'
import type {
  FieldConfiguration,
  FieldRuntime,
  FormConfig,
  FormRuntime,
  IntrospectionField,
  IntrospectionFormOptions,
  IntrospectionFormsDefaults,
  IntrospectionType,
  Props,
  RuntimeFunctions,
  Translate,
} from '../types'
import { findFieldConfiguration } from '../utils/findFieldConfiguration'
import { INTROSPECTION_FORMS_KEY } from '../plugin/keys'
import type { Component } from 'vue'

/**
 * Composable that creates a form configuration with reactive binding.
 * Supports multiple overload signatures for ergonomic usage.
 */
export function useIntrospectionForm<TModel extends object>(
  options: IntrospectionFormOptions<TModel>,
): FormRuntime<TModel>
export function useIntrospectionForm<TModel extends object>(
  introspection: IntrospectionType<TModel>,
  rules: unknown,
  config: FormConfig<TModel> | string,
  ...configs: (FormConfig<TModel> | string)[]
): FormRuntime<TModel>
export function useIntrospectionForm<TModel extends object>(
  introspection: IntrospectionType<TModel>,
  config: FormConfig<TModel> | string,
  ...configs: (FormConfig<TModel> | string)[]
): FormRuntime<TModel>

export function useIntrospectionForm<TModel extends object>(
  arg0: IntrospectionFormOptions<TModel> | IntrospectionType<TModel>,
  arg1?: unknown | FormConfig<TModel> | string,
  ...args: (FormConfig<TModel> | string)[]
): FormRuntime<TModel> {
  const defaults = inject<IntrospectionFormsDefaults | undefined>(INTROSPECTION_FORMS_KEY, undefined)
  const t: Translate = inject<Translate>('introspection-forms:translate', (key: string) => key)

  const { introspection, rules, config, options } = parseArguments<TModel>([arg0, arg1, ...args])
  const order = getFieldOrder(config)
  const fieldIntrospections = Object.fromEntries(introspection.fields.map(f => [f.name, f]))
  const configFromArgs = buildFieldConfiguration(config, defaults, fieldIntrospections, t)
  const configFromDefaults = findMatchingFieldConfiguration(
    configFromArgs,
    defaults,
    fieldIntrospections,
    t,
    introspection,
  )
  const mergedConfigs: Record<string, Partial<FieldConfiguration>> = {}

  for (const fieldName of [...new Set([...Object.keys(configFromDefaults), ...Object.keys(configFromArgs)])]) {
    const def = configFromDefaults[fieldName]
    const arg = configFromArgs[fieldName]
    mergedConfigs[fieldName] = {
      ...def,
      ...arg,
      props: {
        ...def?.props,
        ...arg?.props,
      },
      emits: {
        ...def?.emits,
        ...arg?.emits,
      },
    }
  }

  const fieldRuntimes = createRuntimeFields(mergedConfigs, introspection, order)

  return {
    introspection,
    rules,
    fields: fieldRuntimes,
    visible: (item: TModel) => (options?.visible ? options.visible(item) : true),
    disabled: (item: TModel) => (options?.disabled ? options.disabled(item) : false),
    props: options?.props ? (convertToFunctions(options.props as object) as Record<string, (item?: TModel) => unknown>) : {},
  }
}

function createFieldRuntime(
  name: string,
  value: Partial<FieldConfiguration> | undefined,
  introspection: IntrospectionType,
): Partial<FieldRuntime> {
  return {
    name,
    ...convertToFunctions(value as object),
    introspection: introspection.fields.find(f => f.name === name)!,
    props: value?.props ? convertToFunctions(value.props) : {},
    emits: value?.emits,
  }
}

function convertToFunctions<TModel extends object>(config: TModel): RuntimeFunctions<TModel> {
  if (!config) return {} as RuntimeFunctions<TModel>
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) =>
      key === 'props' || key === 'emits'
        ? [key, value]
        : typeof value === 'function'
          ? [key, value]
          : [key, () => (isRef(value) ? value.value : value)],
    ),
  ) as RuntimeFunctions<TModel>
}

function getFieldOrder<TModel extends object>(config: (FormConfig<TModel> | string)[]) {
  const order: string[] = []
  for (const cf of config) {
    if (typeof cf === 'string') {
      order.push(cf)
    } else {
      order.push(...Object.keys(cf))
    }
  }
  return order
}

function findMatchingFieldConfiguration<TModel extends object>(
  configFromArgs: Record<string, Partial<FieldConfiguration>>,
  defaults: IntrospectionFormsDefaults | undefined,
  fieldIntrospections: Record<string, IntrospectionField>,
  t: Translate,
  introspection: IntrospectionType<TModel>,
): Record<string, Partial<FieldConfiguration> | undefined> {
  const fieldNames = Object.keys(configFromArgs)
  return Object.fromEntries(
    fieldNames.length
      ? (fieldNames
          .map(fieldName => [fieldName, findFieldConfiguration(defaults, fieldIntrospections[fieldName]!, t)])
          .filter(([, v]) => !!v) as [string, Partial<FieldConfiguration>][])
      : introspection.fields.map(f => [f.name, findFieldConfiguration(defaults, f, t)]),
  )
}

function buildFieldConfiguration<TModel extends object>(
  config: (FormConfig<TModel> | string)[],
  defaults: IntrospectionFormsDefaults | undefined,
  fieldIntrospections: Record<string, IntrospectionField>,
  t: Translate,
): Record<string, Partial<FieldConfiguration>> {
  return Object.fromEntries(
    config
      .map(cfg =>
        typeof cfg === 'string'
          ? [cfg, findFieldConfiguration(defaults, fieldIntrospections[cfg]!, t)]
          : Object.entries(cfg as object).map(([fieldName, fieldConfig]) =>
              typeof fieldConfig === 'boolean'
                ? fieldConfig
                  ? [fieldName, findFieldConfiguration(defaults, fieldIntrospections[fieldName]!, t)]
                  : undefined
                : [fieldName, fieldConfig],
            ),
      )
      .flat()
      .filter(Boolean) as [string, Partial<FieldConfiguration>][],
  )
}

function isValidationRuleSet(arg: unknown): boolean {
  return typeof arg === 'object' && arg !== null && 'validators' in arg
}

function parseArguments<TModel extends object>(
  args: unknown[],
) {
  let introspection: IntrospectionType<TModel>
  let rules: unknown | undefined
  let config: (FormConfig<TModel> | string)[]
  let options: IntrospectionFormOptions<TModel> | undefined

  args = args.filter(Boolean)
  const arg0 = args[0]

  if (typeof arg0 === 'object' && arg0 !== null && 'introspection' in arg0) {
    options = arg0 as IntrospectionFormOptions<TModel>
    introspection = options.introspection
    rules = options.rules
    config = [options.config]
  } else {
    introspection = arg0 as IntrospectionType<TModel>
    const arg1 = args[1]

    if (isValidationRuleSet(arg1)) {
      rules = arg1
      config = args.slice(2) as (FormConfig<TModel> | string)[]
    } else {
      config = args.slice(1) as (FormConfig<TModel> | string)[]
    }
  }

  return { introspection, rules, config, options }
}

function createRuntimeFields<TModel extends object>(
  mergedConfigs: Record<string, Partial<FieldConfiguration>>,
  introspection: IntrospectionType<TModel>,
  order: string[],
): Partial<FieldRuntime<Component, TModel>>[] {
  return Object.entries(mergedConfigs)
    .map(([fieldName, config]) => createFieldRuntime(fieldName, config, introspection))
    .sort((a, b) => order.indexOf(a.name!) - order.indexOf(b.name!)) as Partial<FieldRuntime<Component, TModel>>[]
}
