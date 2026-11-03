/** Resolve and embed the independent Linux desktop update feed. */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { dump } from 'js-yaml'
import { resolveDesktopUpdateChannel } from './desktop-auto-update-environment.mjs'

/** Default generic feed served by the Linux distribution repository. */
export const DEFAULT_LINUX_UPDATE_URL = 'https://github.com/du-xinyi/deepseek-harness-linux/releases/latest/download/'

/**
 * Validate a generic Linux feed directory without URL credentials or request parameters.
 * @param {NodeJS.ProcessEnv} environment - Build settings; HTTP is restricted to loopback test servers.
 * @returns {{ publicUrl: string, channel: 'nightly' | 'latest' }} Normalized feed directory and selected channel.
 */
export function resolveLinuxDesktopUpdateConfig(environment = process.env) {
  const value = environment.DSH_DESKTOP_LINUX_UPDATE_URL ?? DEFAULT_LINUX_UPDATE_URL
  let url
  try { url = new URL(value) }
  catch { throw new Error('desktop Linux update: DSH_DESKTOP_LINUX_UPDATE_URL must be an absolute feed directory URL') }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
    || url.username || url.password || url.search || url.hash || value.includes('?') || value.includes('#')) {
    throw new Error('desktop Linux update: feed requires HTTPS, or HTTP loopback, without credentials, query or fragment')
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return { publicUrl: url.href, channel: resolveDesktopUpdateChannel(environment) }
}

/**
 * Write the configuration consumed by electron-updater in Linux packages.
 * @param {string} resourcesDir - Assembled application resources directory.
 * @param {{ publicUrl: string, channel: 'nightly' | 'latest' }} update - Validated feed selection.
 * @param {string} updaterCacheDirName - Electron-builder cache directory for this application.
 * @returns {Promise<void>} Resolves after app-update.yml is written.
 */
export async function writeLinuxAppUpdateConfig(resourcesDir, update, updaterCacheDirName) {
  await writeFile(join(resourcesDir, 'app-update.yml'), dump({
    provider: 'generic', url: update.publicUrl, channel: update.channel, updaterCacheDirName,
  }, { lineWidth: -1, noRefs: true }))
}
