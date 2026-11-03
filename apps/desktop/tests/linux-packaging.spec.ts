import { join } from 'node:path'
import { expect, it } from 'vitest'
import { resolveLinuxPackageTarget } from '../scripts/package-linux.ts'
import { createElectronBuilderConfig } from '../scripts/electron-builder-config.mjs'
import { DEFAULT_LINUX_UPDATE_URL } from '../scripts/linux-update-config.mjs'

it.each(['x64', 'arm64'] as const)('selects a native Linux %s package', (arch) => {
  expect(resolveLinuxPackageTarget(undefined, 'linux', arch)).toBe(`linux-${arch}`)
  const config = createElectronBuilderConfig({ DSH_DESKTOP_APP_ID: 'com.deepseek.harness' }, 'linux', arch)
  expect(config.linux).toMatchObject({ executableName: 'deepseek-harness', target: ['deb'] })
  expect(config.linux.icon).toContain(join(`linux-${arch}`, 'icons'))
  expect(config.directories.output).toContain(join(`linux-${arch}`, 'unsigned-artifacts'))
  expect(config.publish).toEqual([{ provider: 'generic', url: DEFAULT_LINUX_UPDATE_URL, channel: 'nightly' }])
  expect(config.extraMetadata).not.toHaveProperty('dshMandatoryUpdatePolicy')
})

it('embeds a newer Linux build version and independently configured update channel', () => {
  const config = createElectronBuilderConfig({
    DSH_DESKTOP_APP_ID: 'com.deepseek.harness',
    DSH_DESKTOP_BUILD_VERSION: '0.2.2-alpha.2.linux.1',
    DSH_DESKTOP_LINUX_UPDATE_URL: 'http://127.0.0.1:3089/releases/',
    DSH_DESKTOP_UPDATE_CHANNEL: 'nightly',
    DSH_DESKTOP_UNSIGNED: '1',
  }, 'linux', 'x64')
  expect(config.extraMetadata).toMatchObject({ version: '0.2.2-alpha.2.linux.1', dshDesktopUpdateChannel: 'nightly' })
  expect(config.publish).toEqual([{ provider: 'generic', url: 'http://127.0.0.1:3089/releases/', channel: 'nightly' }])
  expect(config.artifactName).toContain('-unsigned.')
  expect(config.detectUpdateChannel).toBe(false)
})

it('rejects a mismatching host before preparing executable runtimes', () => {
  expect(() => resolveLinuxPackageTarget('linux-arm64', 'linux', 'x64')).toThrow('matching Linux build host')
  expect(() => resolveLinuxPackageTarget('linux-x64', 'darwin', 'x64')).toThrow('matching Linux build host')
  expect(() => resolveLinuxPackageTarget('linux-riscv64', 'linux', 'riscv64')).toThrow('expected linux-x64 or linux-arm64')
})
