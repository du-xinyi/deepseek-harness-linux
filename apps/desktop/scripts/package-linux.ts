/** Build Linux desktop packages with an independent generic update feed. */

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { desktopTargetBuildPaths, type DesktopBuildTarget } from './desktop-build-paths.mjs'
import { localMacOSPackageEnvironment } from './desktop-package-environment.mjs'
import { requireDesktopToolchain } from './desktop-toolchain-preflight.ts'
import { DESKTOP_BUILD_VERSION_ENV, validateDesktopBuildVersion } from './desktop-build-version.mjs'
import { resolveLinuxDesktopUpdateConfig } from './linux-update-config.mjs'

const APP_ROOT = resolve(import.meta.dirname, '..')
const REPOSITORY_ROOT = resolve(APP_ROOT, '../..')

/**
 * Select a Linux payload that the build host can execute during preparation.
 * @param name - Optional explicit Linux target.
 * @param platform - Build-host operating system.
 * @param arch - Build-host architecture.
 * @returns Supported native Linux target.
 */
export function resolveLinuxPackageTarget(
  name: string | undefined, platform: NodeJS.Platform = process.platform, arch: string = process.arch,
): Extract<DesktopBuildTarget, `linux-${string}`> {
  const target = name ?? `linux-${arch}`
  if (target !== 'linux-x64' && target !== 'linux-arm64') {
    throw new Error('desktop Linux package: expected linux-x64 or linux-arm64')
  }
  if (platform !== 'linux' || target !== `linux-${arch}`) {
    throw new Error(`desktop Linux package: ${target} requires a matching Linux build host`)
  }
  return target
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2).filter(argument => argument !== '--'),
    options: { arch: { type: 'string' }, 'build-version': { type: 'string' }, 'skip-build': { type: 'boolean', default: false }, dir: { type: 'boolean', default: false }, 'prepare-only': { type: 'boolean', default: false } },
    allowPositionals: true,
  })
  if (positionals.length > 1) throw new Error('desktop Linux package: expected at most one target')
  if (values.arch !== undefined && positionals.length > 0) throw new Error('desktop Linux package: select a target or --arch, not both')
  const target = resolveLinuxPackageTarget(values.arch === undefined ? positionals[0] : `linux-${values.arch}`)
  const arch = target === 'linux-x64' ? 'x64' : 'arm64'
  const environment: NodeJS.ProcessEnv = {
    ...localMacOSPackageEnvironment(),
    DSH_DESKTOP_TARGET_PLATFORM: 'linux',
    DSH_DESKTOP_TARGET_ARCH: arch,
  }
  if (values['build-version'] !== undefined) {
    const product = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
    environment[DESKTOP_BUILD_VERSION_ENV] = validateDesktopBuildVersion(values['build-version'], product.version)
  }
  resolveLinuxDesktopUpdateConfig(environment)
  const paths = desktopTargetBuildPaths(target, environment)
  const pnpmEntry = process.env.npm_execpath
  if (!pnpmEntry) throw new Error('desktop Linux package: invoke through a pnpm package command')
  const run = async (args: readonly string[], cwd = APP_ROOT): Promise<void> => {
    await new Promise<void>((resolvePromise, reject) => {
      const child = spawn(process.execPath, [pnpmEntry, ...args], { cwd, env: environment, stdio: 'inherit' })
      child.once('error', reject)
      child.once('close', (code, signal) => {
        if (code === 0) resolvePromise()
        else reject(new Error(`desktop Linux package: pnpm ${args.join(' ')} exited with ${String(code ?? signal)}`))
      })
    })
  }
  await requireDesktopToolchain('linux', environment)
  if (!values['skip-build']) await run(['run', 'build', '--profile', 'local'], REPOSITORY_ROOT)
  await run(['exec', 'tsx', 'apps/desktop/scripts/pack-local-packages.ts', '--out', paths.packedDsh, '--concurrency', '4'], REPOSITORY_ROOT)
  await run(['--dir', 'apps/desktop-host', 'pack', '--pack-destination', paths.packedDsh], REPOSITORY_ROOT)
  await run(['run', 'release:pack', '--family', 'vendor', '--out', paths.packedVendor, '--concurrency', '4'], REPOSITORY_ROOT)
  rmSync(paths.packedLandlock, { recursive: true, force: true })
  mkdirSync(paths.packedLandlock, { recursive: true })
  await run(['--dir', 'native/system', 'run', 'build:ts'], REPOSITORY_ROOT)
  await run(['--dir', 'native/system/packages/entry', 'pack', '--pack-destination', paths.packedLandlock], REPOSITORY_ROOT)
  await run(['run', 'prepare:runtime'])
  await run(['run', 'prepare:packages'])
  await run(['run', 'prepare:dsh'])
  if (values['prepare-only']) return
  await run(['exec', 'electron-builder', '--config', 'electron-builder.config.mjs', '--linux',
    arch === 'x64' ? '--x64' : '--arm64', '--publish', 'never', ...(values.dir ? ['--dir'] : [])])
  await run(['exec', 'tsx', 'scripts/smoke-packaged-runtime.ts', '--unsigned'])
  console.log(`desktop Linux package: artifacts in ${paths.unsignedArtifacts}`)
}

if (import.meta.main) await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
