import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join, normalize } from 'path'
import SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types'

interface GeneratedFile {
  name: string
  content: string
}

/**
 * Configuration for the OpenAPI introspection-forms generator.
 */
export interface OpenApiCodegenConfig {
  /**
   * Path to a local OpenAPI file (JSON or YAML) or a URL to fetch from.
   * Required.
   */
  source: string

  /**
   * Output directory where generated TypeScript files will be placed.
   * Required.
   */
  output: string

  /**
   * Import path for the IntrospectionType interface.
   * @default '@softwareproduction/introspection-forms'
   */
  introspectionTypeImport?: string

  /**
   * Import path for the generated TypeScript types.
   * If not set, no separate type import is generated and inline types are used.
   * @default undefined
   */
  typesImport?: string

  /**
   * File name prefix for generated files.
   * @default 'TypeOf'
   */
  filePrefix?: string

  /**
   * Whether to format output with prettier.
   * @default true
   */
  prettier?: boolean

  /**
   * Filter which schemas to include. If provided, only schemas whose names
   * match at least one pattern (string or RegExp) are generated.
   */
  include?: (string | RegExp)[]

  /**
   * Filter which schemas to exclude.
   */
  exclude?: (string | RegExp)[]
}

/**
 * Generate introspection metadata from an OpenAPI specification.
 *
 * @example
 * ```ts
 * import { generateFromOpenApi } from '@softwareproduction/introspection-forms/openapi'
 *
 * await generateFromOpenApi({
 *   source: './openapi.yaml',
 *   output: './src/generated/introspection',
 * })
 * ```
 */
export async function generateFromOpenApi(config: OpenApiCodegenConfig): Promise<void> {
  if (!config.source) {
    throw new Error('[introspection-forms/openapi] `source` is required')
  }
  if (!config.output) {
    throw new Error('[introspection-forms/openapi] `output` is required')
  }

  const introspectionTypeImport = config.introspectionTypeImport ?? '@softwareproduction/introspection-forms'
  const filePrefix = config.filePrefix ?? 'TypeOf'
  const usePrettier = config.prettier !== false

  const api = await SwaggerParser.dereference(config.source)
  const schemas = extractSchemas(api)

  const files: GeneratedFile[] = []

  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!shouldInclude(schemaName, config.include, config.exclude)) continue
    if (!schema.properties && !schema.allOf) continue

    const resolved = resolveAllOf(schema as OpenAPIV3.SchemaObject)
    if (!resolved.properties) continue

    const requiredFields = new Set(resolved.required ?? [])
    const fieldInfos: string[] = []
    const defaultEntries: string[] = []

    for (const [fieldName, prop] of Object.entries(resolved.properties)) {
      const schemaProp = prop as OpenAPIV3.SchemaObject
      const isRequired = requiredFields.has(fieldName)
      const isNullable = !isRequired || schemaProp.nullable === true
      const { type, originalType, isArray, isEnum, enumValues } = classifyProperty(schemaProp)
      const defaultValue = getDefaultValue(schemaProp, type, isNullable, isEnum, enumValues)

      fieldInfos.push(
        JSON.stringify({ name: fieldName, type, originalType, isArray, isNullable, isEnum, enumValues, defaultValue }, null, 2),
      )
      defaultEntries.push(`  ${fieldName}: ${JSON.stringify(defaultValue)}`)
    }

    const typeName = sanitizeName(schemaName)
    const typeAnnotation = config.typesImport
      ? typeName
      : `{ ${Object.keys(resolved.properties).map(f => `${f}: any`).join('; ')} }`
    const typeGeneric = config.typesImport ? `<${typeName}>` : ''

    const imports = [
      `import type { IntrospectionType } from '${introspectionTypeImport}'`,
      config.typesImport ? `import type { ${typeName} } from '${config.typesImport}'` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const code = `${imports}

/**
 * Introspection metadata for ${schemaName}
 */
export const ${filePrefix}${typeName}: IntrospectionType${typeGeneric} = {
  name: '${schemaName}',
  fields: [\n${fieldInfos.join(',\n')}\n  ],
  create(defaultValues?: Partial<${typeAnnotation}>): ${typeAnnotation} {
    return {...${`{\n${defaultEntries.join(',\n')}\n  }`}, ...(defaultValues || {})} as ${typeAnnotation}
  }
}`

    files.push({ name: `${filePrefix}${typeName}`, content: code })
  }

  const dir = normalize(config.output)
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true })
  }
  mkdirSync(dir, { recursive: true })

  let format: (code: string) => Promise<string> = async (code) => code
  if (usePrettier) {
    try {
      const prettier = await import('prettier')
      const prettierConfig = await prettier.default.resolveConfig(dir)
      format = (code: string) =>
        prettier.default.format(code, { ...prettierConfig, parser: 'typescript' })
    } catch {
      // prettier not available, skip formatting
    }
  }

  for (const file of files) {
    const path = join(dir, `${file.name}.ts`)
    try {
      const content = await format(file.content)
      writeFileSync(path, content)
    } catch (err) {
      console.error(`[introspection-forms/openapi] Could not write file ${path}`, err)
    }
  }

  const indexContent = files.map((file) => `export * from './${file.name}';`).join('\n')
  const formattedIndex = await format(indexContent)
  writeFileSync(join(dir, 'index.ts'), formattedIndex)

  console.log(`[introspection-forms/openapi] Generated ${files.length} introspection type files in ${dir}`)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractSchemas(api: OpenAPI.Document): Record<string, OpenAPIV3.SchemaObject> {
  // OpenAPI 3.x
  if ('components' in api) {
    const doc = api as OpenAPIV3.Document
    return (doc.components?.schemas ?? {}) as Record<string, OpenAPIV3.SchemaObject>
  }
  // Swagger 2.x
  if ('definitions' in api) {
    const doc = api as OpenAPIV2.Document
    return (doc.definitions ?? {}) as unknown as Record<string, OpenAPIV3.SchemaObject>
  }
  return {}
}

function resolveAllOf(schema: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject {
  if (schema.allOf) {
    const merged: OpenAPIV3.SchemaObject = { properties: {}, required: [] }
    for (const sub of schema.allOf) {
      const resolved = resolveAllOf(sub as OpenAPIV3.SchemaObject)
      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties }
      }
      if (resolved.required) {
        merged.required = [...(merged.required ?? []), ...resolved.required]
      }
    }
    return merged
  }
  return schema
}

function classifyProperty(
  prop: OpenAPIV3.SchemaObject,
): { type: string; originalType: string; isArray: boolean; isEnum: boolean; enumValues: string[] } {
  if (prop.enum) {
    return { type: 'enum', originalType: 'enum', isArray: false, isEnum: true, enumValues: prop.enum as string[] }
  }

  if (prop.type === 'array' && prop.items) {
    const inner = prop.items as OpenAPIV3.SchemaObject
    const innerClass = classifyProperty(inner)
    return { ...innerClass, isArray: true }
  }

  const format = prop.format ?? ''
  const propType = prop.type ?? 'string'

  switch (propType) {
    case 'integer':
    case 'number':
      return { type: 'number', originalType: format || propType, isArray: false, isEnum: false, enumValues: [] }
    case 'boolean':
      return { type: 'boolean', originalType: 'boolean', isArray: false, isEnum: false, enumValues: [] }
    case 'string':
      if (format === 'date' || format === 'date-time') {
        return { type: 'string', originalType: 'DateTime', isArray: false, isEnum: false, enumValues: [] }
      }
      return { type: 'string', originalType: format || 'string', isArray: false, isEnum: false, enumValues: [] }
    case 'object':
      return { type: 'object', originalType: 'object', isArray: false, isEnum: false, enumValues: [] }
    default:
      return { type: 'string', originalType: propType, isArray: false, isEnum: false, enumValues: [] }
  }
}

function getDefaultValue(
  prop: OpenAPIV3.SchemaObject,
  type: string,
  isNullable: boolean,
  isEnum: boolean,
  enumValues: string[],
): unknown {
  if (prop.default !== undefined) return prop.default

  if (isNullable) return null

  if (isEnum && enumValues.length > 0) return enumValues[0]

  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'object':
      return null
    default:
      return null
  }
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '')
}

function shouldInclude(name: string, include?: (string | RegExp)[], exclude?: (string | RegExp)[]): boolean {
  if (exclude?.some((p) => (typeof p === 'string' ? name === p : p.test(name)))) return false
  if (include && !include.some((p) => (typeof p === 'string' ? name === p : p.test(name)))) return false
  return true
}

export default generateFromOpenApi
