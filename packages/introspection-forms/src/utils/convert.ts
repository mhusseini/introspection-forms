/**
 * Converts a value to the expected type based on the introspection field type.
 * Handles the mismatch between HTML input string values and model types.
 */
export function convert(value: unknown, type: string): unknown {
  switch (type) {
    case 'boolean':
      return !!value && !/false|0|off|no/i.test(String(value))
    case 'number':
      return value == null ? value : Number(value)
    case 'string':
      return value == null ? value : String(value)
    default:
      return value
  }
}
