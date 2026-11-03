/** Default generic feed served by the Linux distribution repository. */
export const DEFAULT_LINUX_UPDATE_URL: string

/** Linux update feed validated before packaging. */
export interface LinuxDesktopUpdateConfig {
  readonly publicUrl: string
  readonly channel: 'nightly' | 'latest'
}

/**
 * Validate a generic Linux feed directory without URL credentials or request parameters.
 * @param environment Build settings; HTTP is restricted to loopback test servers.
 * @returns Normalized feed directory and selected channel.
 */
export function resolveLinuxDesktopUpdateConfig(environment?: NodeJS.ProcessEnv): LinuxDesktopUpdateConfig

/**
 * Write the configuration consumed by electron-updater in Linux packages.
 * @param resourcesDir Assembled application resources directory.
 * @param update Validated feed selection.
 * @param updaterCacheDirName Electron-builder cache directory for this application.
 * @returns Resolves after app-update.yml is written.
 */
export function writeLinuxAppUpdateConfig(resourcesDir: string, update: LinuxDesktopUpdateConfig, updaterCacheDirName: string): Promise<void>
