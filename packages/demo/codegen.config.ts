import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './src/schema/schema.graphql',
  generates: {
    // Generate TypeScript types from the schema
    './src/generated/graphql-types.ts': {
      plugins: ['typescript'],
      config: {
        enumsAsTypes: false,
        scalars: {
          DateTime: 'string',
        },
      },
    },
    // Generate introspection metadata
    './src/generated/introspection/_placeholder.ts': {
      plugins: ['@softwareproduction/introspection-forms/codegen'],
      config: {
        output: './src/generated/introspection',
        typesImport: '../graphql-types',
        introspectionTypeImport: '@softwareproduction/introspection-forms',
      },
    },
  },
}

export default config
