import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'codegen/index': 'src/codegen/index.ts',
    'openapi/index': 'src/openapi/index.ts',
    'plugin/index': 'src/plugin/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['vue', 'graphql', '@graphql-codegen/plugin-helpers', 'prettier', 'yaml'],
})
