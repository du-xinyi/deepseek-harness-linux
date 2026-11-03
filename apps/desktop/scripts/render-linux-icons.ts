/** Render the shared artwork at sizes registered by the Linux hicolor theme. */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'

/** Standard square PNG sizes used by Linux application launchers. */
export const LINUX_ICON_SIZES = [16, 32, 48, 64, 128, 256, 512] as const

/**
 * Materialize launcher icons for electron-builder's Linux icon directory.
 * @param destination - Target-owned generated icon directory.
 * @returns Resolves after all standard PNG sizes have been written.
 */
export async function renderLinuxIcons(destination: string): Promise<void> {
  await mkdir(destination, { recursive: true })
  const source = fileURLToPath(new URL('../resources/icon.png', import.meta.url))
  await Promise.all(LINUX_ICON_SIZES.map(size => sharp(source).resize(size, size).png()
    .toFile(join(destination, `${String(size)}x${String(size)}.png`))))
}

if (import.meta.main) await renderLinuxIcons(join(resolveDesktopTargetBuildPaths().root, 'icons'))
