import type { CodegenPlugin, Types } from '@graphql-codegen/plugin-helpers'
import {
  type GraphQLNamedType,
  type GraphQLSchema,
  type GraphQLType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
  GraphQLObjectType,
} from 'graphql'
import type { GraphQLWrappingType } from 'graphql'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join, normalize } from 'path'

interface GeneratedFile {
  name: string
  content: string
}

/**
 * Configuration for the introspection-forms codegen plugin.
 */
export interface IntrospectionFormsCodegenConfig {
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
   * Import path for the generated GraphQL types.
   * @default './types' (relative import from the output directory)
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
}

/**
 * GraphQL Codegen plugin that generates introspection metadata for input types.
 *
 * For each `input` type in the GraphQL schema, it produces a TypeScript file
 * containing an `IntrospectionType` constant with field metadata and a `create()` factory.
 *
 * @example codegen.config.ts
 * ```ts
 * import type { CodegenConfig } from '@graphql-codegen/cli'
 *
 * const config: CodegenConfig = {
 *   schema: './schema.graphql',
 *   generates: {
 *     './src/generated/introspection/placeholder.ts': {
 *       plugins: ['@softwareproduction/introspection-forms/codegen'],
 *       config: {
 *         output: './src/generated/introspection',
 *         typesImport: '../graphql-types',
 *       },
 *     },
 *   },
 * }
 * export default config
 * ```
 */
export async function plugin(
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: IntrospectionFormsCodegenConfig,
) {
  if (!config.output) {
    throw new Error('[introspection-forms] Plugin configuration error: `output` is required')
  }

  const introspectionTypeImport = config.introspectionTypeImport ?? '@softwareproduction/introspection-forms'
  const typesImport = config.typesImport ?? '../types'
  const filePrefix = config.filePrefix ?? 'TypeOf'
  const usePrettier = config.prettier !== false

  try {
    const files: GeneratedFile[] = []
    const typeMap = schema.getTypeMap()

    for (const typeName in typeMap) {
      const type = typeMap[typeName]

      if (typeName.startsWith('__') || !isInputObjectType(type)) {
        continue
      }

      const typesToImport: string[] = [`type ${typeName}`]
      const defaultValues = generateDefaultValuesForInputType(schema, type, typesToImport, true, filePrefix)
      const fieldInfos = generateFieldInfoForInputType(schema, type)
      const uniqueTypes = [...new Set(typesToImport)].join(', ')
      const code = generateCode(typeName, fieldInfos, defaultValues, filePrefix).replace(/%%"|"%%/g, '')

      const imports = [
        `import type { IntrospectionType } from '${introspectionTypeImport}'`,
        uniqueTypes.length > 0 ? `import { ${uniqueTypes} } from '${typesImport}'` : null,
        ...[
          ...new Set(
            [...code.matchAll(new RegExp(`(${filePrefix}([\\w_]+))`, 'g'))]
              .filter(m => m[2] !== typeName)
              .map(m => m[1]),
          ),
        ].map(t => `import { ${t} } from './${t}';`),
      ]
        .filter(Boolean)
        .join('\n')

      files.push({
        name: `${filePrefix}${typeName}`,
        content: `${imports}\n\n${code}`,
      })
    }

    const dir = normalize(config.output)
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true })
    }
    mkdirSync(dir, { recursive: true })

    let format: (code: string) => Promise<string> = async code => code
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
        console.error(`[introspection-forms] Could not write file ${path}`, err)
      }
    }

    const indexContent = files.map(file => `export * from './${file.name}';`).join('\n')
    const formattedIndex = await format(indexContent)
    writeFileSync(join(dir, 'index.ts'), formattedIndex)

    console.log(`[introspection-forms] Generated ${files.length} introspection type files in ${dir}`)
  } catch (err) {
    console.error('[introspection-forms] Error generating introspection types:', err)
  }

  return ''
}

const pluginExport: CodegenPlugin = { plugin }
export default pluginExport

function getDefaultValueForType(
  schema: GraphQLSchema,
  type: GraphQLType,
  isRequired: boolean = false,
  typesToImport: string[] = [],
  includeObjects = false,
  filePrefix = 'TypeOf',
): unknown {
  if (isNonNullType(type)) {
    return getDefaultValueForType(schema, type.ofType, true, typesToImport, includeObjects, filePrefix)
  }

  if (isListType(type)) {
    return []
  }

  const namedType = (type as unknown as GraphQLWrappingType)?.ofType || type

  if (isEnumType(namedType)) {
    if (isRequired) {
      typesToImport.push(namedType.name)
    }
    const enumValues = namedType.getValues()
    return isRequired ? enumValues[0].name : null
  }

  if (isScalarType(namedType)) {
    switch (namedType.name) {
      case 'String':
        return isRequired ? '' : null
      case 'Int':
      case 'Float':
        return isRequired ? 0 : null
      case 'Boolean':
        return isRequired ? false : null
      case 'ID':
        return isRequired ? '' : null
      case 'DateTime':
        return isRequired ? '%%new Date().toISOString()%%' : null
      default:
        return null
    }
  }

  if (isInputObjectType(namedType)) {
    return includeObjects ? `%%${filePrefix}${namedType.name}.create()%%` : '%%undefined%%'
  }

  return null
}

function generateDefaultValuesForInputType(
  schema: GraphQLSchema,
  inputType: GraphQLType,
  typesToImport: string[] = [],
  includeObjects = false,
  filePrefix = 'TypeOf',
): string {
  const fields = (inputType as unknown as GraphQLObjectType).getFields()
  const fieldDefaults: string[] = []

  for (const fieldName in fields) {
    const field = fields[fieldName]
    const fieldType = field.type
    const defaultValue = getDefaultValueForType(schema, fieldType, false, typesToImport, includeObjects, filePrefix)
    fieldDefaults.push(`  ${fieldName}: ${JSON.stringify(defaultValue, null, 2)}`)
  }

  return `{\n${fieldDefaults.join(',\n')}\n}`
}

function generateFieldInfoForInputType(schema: GraphQLSchema, inputType: GraphQLNamedType): string {
  const fields = (inputType as unknown as GraphQLObjectType).getFields()
  const fieldInfos: string[] = []

  for (const fieldName in fields) {
    const field = fields[fieldName]
    const fieldType = field.type as GraphQLNamedType

    const typeInfo: Record<string, unknown> = {
      name: fieldName,
      type: 'object',
      originalType: fieldType.name,
      isArray: false,
      isNullable: !isNonNullType(fieldType),
      isEnum: false,
      enumValues: [] as string[],
      defaultValue: null as unknown,
    }

    let currentType = fieldType as GraphQLType

    if (isNonNullType(currentType)) {
      currentType = currentType.ofType
    }

    if (isListType(currentType)) {
      typeInfo.isArray = true
      currentType = currentType.ofType

      if (isNonNullType(currentType)) {
        currentType = currentType.ofType
      }
    }

    const namedType = ((currentType as unknown as GraphQLWrappingType)?.ofType || currentType) as GraphQLNamedType
    typeInfo.originalType = namedType.name

    if (isEnumType(namedType)) {
      typeInfo.isEnum = true
      typeInfo.enumValues = namedType.getValues().map(v => v.name)
      typeInfo.type = 'enum'
    } else if (isScalarType(namedType)) {
      switch (namedType.name) {
        case 'String':
        case 'ID':
        case 'DateTime':
          typeInfo.type = 'string'
          break
        case 'Int':
        case 'Float':
          typeInfo.type = 'number'
          break
        case 'Boolean':
          typeInfo.type = 'boolean'
          break
      }
    }

    typeInfo.defaultValue = getDefaultValueForType(schema, field.type, !(typeInfo.isNullable as boolean))

    fieldInfos.push(JSON.stringify(typeInfo, null, 2))
  }

  return `[\n${fieldInfos.join(',\n')}\n]`
}

function generateCode(typeName: string, fieldInfos: string, defaultValues: string, filePrefix: string) {
  return `/**
 * Introspection metadata for ${typeName}
 */
export const ${filePrefix}${typeName}: IntrospectionType<${typeName}> = {
  name: '${typeName}',
  fields: ${fieldInfos},
  create(defaultValues?: Partial<${typeName}>): ${typeName} {
    return {...${defaultValues}, ...(defaultValues || {})} as ${typeName}
  }
}`
}
