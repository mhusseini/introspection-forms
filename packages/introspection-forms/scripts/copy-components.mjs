// Copies the Vue SFCs into dist/ so the published package ships them
// (exports["./components/*"] -> ./dist/components/*).
import { cpSync, mkdirSync, readdirSync } from 'node:fs'
mkdirSync('dist/components', { recursive: true })
for (const f of readdirSync('src/components')) {
  if (f.endsWith('.vue')) cpSync(`src/components/${f}`, `dist/components/${f}`)
}
console.log('copied components to dist/components')
