import type { Component } from 'vue'
import type { ConfigValue, Props } from '../types'

/**
 * Utility to provide type-safe props to a component.
 * Enables IDE autocompletion and type-checking for component props
 * when configuring fields in useIntrospectionForm.
 */
export function withProps<TComponent extends Component = Component, TModel extends object = object>(
  config: () => ConfigValue<Props<TComponent>, TModel>,
): ConfigValue<Props<TComponent>, TModel> {
  return config()
}
