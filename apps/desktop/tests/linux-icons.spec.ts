import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, onTestFinished } from 'vitest'
import sharp from 'sharp'
import { renderLinuxIcons } from '../scripts/render-linux-icons.ts'

it('renders application artwork into standard hicolor sizes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-linux-icons-'))
  onTestFinished(async () => { await rm(directory, { recursive: true, force: true }) })
  await renderLinuxIcons(directory)
  const files = await readdir(directory)
  expect(files.sort()).toEqual(['16x16.png', '32x32.png', '48x48.png', '64x64.png', '128x128.png', '256x256.png', '512x512.png'].sort())
  for (const file of files) {
    const size = Number(file.split('x')[0])
    const metadata = await sharp(join(directory, file)).metadata()
    expect(metadata).toMatchObject({ width: size, height: size, format: 'png', hasAlpha: true })
  }
})
