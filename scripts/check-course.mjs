// Vérifie le contenu du cours avant le build (npm run check:course).
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'rolldown'

const dir = mkdtempSync(join(tmpdir(), 'nuage-course-'))
const file = join(dir, 'check.mjs')
try {
  await build({ input: new URL('./check-course.entry.ts', import.meta.url).pathname, output: { file, format: 'esm', codeSplitting: false }, platform: 'node', logLevel: 'silent' })
  const { run } = await import(pathToFileURL(file).href)
  process.exitCode = run() ? 0 : 1
} finally {
  rmSync(dir, { recursive: true, force: true })
}
