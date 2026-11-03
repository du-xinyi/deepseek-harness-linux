/** Run real Linux updater checks without installing a system package or changing user profiles. */
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'

if (process.platform !== 'linux') throw new Error('Linux updater qualification requires Linux')
const root = await mkdtemp(join(tmpdir(), 'dsh-linux-update-'))
const executable = join(resolveDesktopTargetBuildPaths().electron, 'electron')
let timedOut = false
try {
  const child = spawn(executable, [fileURLToPath(new URL('../tests/fixtures/linux-updater.mjs', import.meta.url))], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '', DSH_LINUX_UPDATE_TEST_ROOT: root }, stdio: 'inherit',
  })
  const timer = setTimeout(() => { timedOut = true; child.kill() }, 60_000)
  try {
    const result = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('close', (code, signal) => { resolve({ code, signal }) })
    })
    if (timedOut || result.code !== 0) throw new Error(`Linux updater qualification failed: ${JSON.stringify(result)}, timedOut=${String(timedOut)}`)
  } finally { clearTimeout(timer) }
} finally {
  await rm(root, { recursive: true, force: true })
}
