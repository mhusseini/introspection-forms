import { inject } from 'vue'
import type { IntrospectionField, IntrospectionFormsDefaults } from '../types'
import { INTROSPECTION_FORMS_KEY } from '../plugin/keys'

/**
 * Provides filtering functionality for enum values based on registered enum filters.
 */
export function useIntrospectionFormsEnumFilter() {
  const defaults = inject<IntrospectionFormsDefaults | undefined>(INTROSPECTION_FORMS_KEY, undefined)

  return { filterEnumValues }

  /**
   * Filters enum values based on registered enum filters for the field type.
   */
  function filterEnumValues(introspection: IntrospectionField): string[] {
    if (!introspection.isEnum) {
      throw new Error(`Field ${introspection.name} is not an enum`)
    }
    if (!introspection.enumValues?.length) {
      throw new Error(`Field ${introspection.name} has no enum values`)
    }

    const filter = defaults?.enumFilters?.[introspection.originalType]
    return !filter ? introspection.enumValues : filter(introspection.enumValues)
  }
}
