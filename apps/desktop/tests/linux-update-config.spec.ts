import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'
import { DEFAULT_LINUX_UPDATE_URL, resolveLinuxDesktopUpdateConfig, writeLinuxAppUpdateConfig } from '../scripts/linux-update-config.mjs'

it('uses the Linux distribution repository and nightly channel by default', () => {
  expect(resolveLinuxDesktopUpdateConfig({})).toEqual({ publicUrl: DEFAULT_LINUX_UPDATE_URL, channel: 'nightly' })
})

it.each(['https://example.com/updates', 'http://127.0.0.1:3089/updates', 'http://localhost:3089/updates', 'http://[::1]:3089/updates'])('accepts a feed directory and normalizes its trailing slash: %s', (url) => {
  expect(resolveLinuxDesktopUpdateConfig({ DSH_DESKTOP_LINUX_UPDATE_URL: url, DSH_DESKTOP_UPDATE_CHANNEL: 'latest' }))
    .toEqual({ publicUrl: `${url}/`, channel: 'latest' })
})

it.each(['', '/updates/', 'file:///tmp/updates/', 'http://example.com/updates/', 'https://user:secret@example.com/',
  'https://example.com/?token=secret', 'https://example.com/#fragment', 'https://example.com/?', 'https://example.com/#'])('rejects unsupported or credential-bearing feed locations: %s', (url) => {
  expect(() => resolveLinuxDesktopUpdateConfig({ DSH_DESKTOP_LINUX_UPDATE_URL: url })).toThrow('desktop Linux update:')
})

it('rejects an unknown update channel', () => {
  expect(() => resolveLinuxDesktopUpdateConfig({ DSH_DESKTOP_UPDATE_CHANNEL: 'alpha' })).toThrow()
})

it('writes the generic updater settings into Linux application resources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-linux-feed-'))
  try {
    await writeLinuxAppUpdateConfig(directory, resolveLinuxDesktopUpdateConfig({}), 'deepseek-harness-updater')
    expect(load(await readFile(join(directory, 'app-update.yml'), 'utf8'))).toEqual({
      provider: 'generic', url: DEFAULT_LINUX_UPDATE_URL, channel: 'nightly', updaterCacheDirName: 'deepseek-harness-updater',
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
