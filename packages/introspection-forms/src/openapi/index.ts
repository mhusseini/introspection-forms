import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, normalize } from 'path'

interface GeneratedFile {
  name: string
  content: string
}

interface OpenApiProperty {
  type?: string
  format?: string
  enum?: string[]
  $ref?: string
  items?: OpenApiProperty
  nullable?: boolean
  default?: unknown
  properties?: Record<string, OpenApiProperty>
  required?: string[]
  allOf?: OpenApiProperty[]
  oneOf?: OpenApiProperty[]
  anyOf?: OpenApiProperty[]
}

interface OpenApiSchema {
  type?: string
  format?: string
  enum?: string[]
  properties?: Record<string, OpenApiProperty>
  required?: string[]
  allOf?: OpenApiProperty[]
  oneOf?: OpenApiProperty[]
  anyOf?: OpenApiProperty[]
  $ref?: string
}

interface OpenApiDocument {
  openapi?: string
  swagger?: string
  components?: { schemas?: Record<string, OpenApiSchema> }
  definitions?: Record<string, OpenApiSchema>
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
   * @default 'introspection-forms'
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
 * import { generateFromOpenApi } from 'introspection-forms/openapi'
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

  const introspectionTypeImport = config.introspectionTypeImport ?? 'introspection-forms'
  const filePrefix = config.filePrefix ?? 'TypeOf'
  const usePrettier = config.prettier !== false

  const doc = await loadDocument(config.source)
  const schemas = extractSchemas(doc)

  const files: GeneratedFile[] = []

  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!shouldInclude(schemaName, config.include, config.exclude)) continue
    if (!schema.properties && !schema.allOf) continue

    const resolved = resolveSchema(schema, schemas)
    if (!resolved.properties) continue

    const requiredFields = new Set(resolved.required ?? [])
    const fieldInfos: string[] = []
    const defaultEntries: string[] = []

    for (const [fieldName, prop] of Object.entries(resolved.properties)) {
      const resolvedProp = resolveProperty(prop, schemas)
      const isRequired = requiredFields.has(fieldName)
      const isNullable = !isRequired || resolvedProp.nullable === true
      const { type, originalType, isArray, isEnum, enumValues } = classifyProperty(resolvedProp, schemas)
      const defaultValue = getDefaultValue(resolvedProp, type, isNullable, isEnum, enumValues)

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

async function loadDocument(source: string): Promise<OpenApiDocument> {
  let raw: string

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`[introspection-forms/openapi] Failed to fetch ${source}: ${response.status}`)
    }
    raw = await response.text()
  } else {
    raw = readFileSync(source, 'utf-8')
  }

  // Try JSON first, fall back to YAML
  try {
    return JSON.parse(raw)
  } catch {
    // Simple YAML subset parser for common OpenAPI files
    // For full YAML support, users should install the `yaml` package
    try {
      const yaml = await import('yaml')
      return yaml.parse(raw)
    } catch {
      throw new Error(
        '[introspection-forms/openapi] Could not parse source. For YAML files, install the `yaml` package: npm install yaml',
      )
    }
  }
}

function extractSchemas(doc: OpenApiDocument): Record<string, OpenApiSchema> {
  // OpenAPI 3.x
  if (doc.components?.schemas) return doc.components.schemas
  // Swagger 2.x
  if (doc.definitions) return doc.definitions
  return {}
}

function resolveRef(ref: string, schemas: Record<string, OpenApiSchema>): OpenApiSchema | undefined {
  // #/components/schemas/Foo or #/definitions/Foo
  const parts = ref.split('/')
  const name = parts[parts.length - 1]
  return schemas[name]
}

function resolveSchema(schema: OpenApiSchema, schemas: Record<string, OpenApiSchema>): OpenApiSchema {
  if (schema.$ref) {
    return resolveRef(schema.$ref, schemas) ?? schema
  }
  if (schema.allOf) {
    const merged: OpenApiSchema = { properties: {}, required: [] }
    for (const sub of schema.allOf) {
      const resolved = resolveSchema(sub as OpenApiSchema, schemas)
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

function resolveProperty(prop: OpenApiProperty, schemas: Record<string, OpenApiSchema>): OpenApiProperty {
  if (prop.$ref) {
    return (resolveRef(prop.$ref, schemas) as unknown as OpenApiProperty) ?? prop
  }
  if (prop.allOf) {
    const merged: OpenApiProperty = {}
    for (const sub of prop.allOf) {
      const resolved = resolveProperty(sub, schemas)
      Object.assign(merged, resolved)
      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties }
      }
    }
    return merged
  }
  return prop
}

function classifyProperty(
  prop: OpenApiProperty,
  schemas: Record<string, OpenApiSchema>,
): { type: string; originalType: string; isArray: boolean; isEnum: boolean; enumValues: string[] } {
  if (prop.enum) {
    return { type: 'enum', originalType: 'enum', isArray: false, isEnum: true, enumValues: prop.enum }
  }

  if (prop.type === 'array' && prop.items) {
    const inner = resolveProperty(prop.items, schemas)
    const innerClass = classifyProperty(inner, schemas)
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
  prop: OpenApiProperty,
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
