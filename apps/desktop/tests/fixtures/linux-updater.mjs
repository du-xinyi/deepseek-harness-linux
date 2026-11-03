/** Exercise real Linux downloads and replace only a temporary inert AppImage. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import updaterModule from 'electron-updater'
import { DesktopUpdateCoordinator } from '../../lib/types/update-coordinator.js'
import { DesktopUpdateHttpExecutor } from '../../lib/types/update-http-executor.js'

const root = process.env.DSH_LINUX_UPDATE_TEST_ROOT
assert.ok(root, 'The launcher must allocate an isolated directory')
app.setPath('userData', join(root, 'electron'))
const version = '1.1.0'
const image = Buffer.from('#!/bin/sh\nprintf "updated\\n" > "$DSH_LINUX_UPDATE_MARKER"\n')
const deb = Buffer.from('inert deb download fixture; never installed')
const digest = bytes => createHash('sha512').update(bytes).digest('base64')
const requests = []
let corrupt = false
const server = createServer((request, response) => {
  requests.push(request.url)
  if (request.url?.startsWith('/nightly-linux')) {
    response.setHeader('Content-Type', 'application/yaml')
    response.end(JSON.stringify({ version, releaseDate: '2026-11-03T00:00:00.000Z',
      files: [{ url: 'update.AppImage', sha512: digest(corrupt ? Buffer.from('wrong') : image), size: image.length },
        { url: 'update.deb', sha512: digest(deb), size: deb.length }],
      path: 'update.AppImage', sha512: digest(image) }))
  } else if (request.url === '/update.AppImage') response.end(image)
  else if (request.url === '/update.deb') response.end(deb)
  else { response.statusCode = 404; response.end() }
})
const coordinators = []

async function main() {
  await app.whenReady()
  await new Promise(resolve => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const url = `http://127.0.0.1:${address.port}/`
  async function fixture(name, kind) {
    const directory = join(root, name)
    await mkdir(directory, { recursive: true })
    const config = join(directory, 'app-update.yml')
    await writeFile(config, JSON.stringify({ provider: 'generic', url, updaterCacheDirName: name }))
    const quit = Promise.withResolvers()
    const adapter = { version: '1.0.0', name, isPackaged: true, appUpdateConfigPath: config,
      userDataPath: directory, baseCachePath: directory, whenReady: async () => {},
      quit: () => { quit.resolve() }, relaunch: () => { throw new Error('Unexpected system relaunch') },
      onQuit: () => { throw new Error('Implicit installation is forbidden') } }
    const updater = kind === 'deb' ? new updaterModule.DebUpdater(undefined, adapter)
      : new updaterModule.AppImageUpdater(undefined, adapter)
    updater.logger = null
    updater.httpExecutor = new DesktopUpdateHttpExecutor(10_000)
    updater.disableDifferentialDownload = true
    updater.setFeedURL({ provider: 'generic', url })
    let allowRestart = false
    const states = []
    const coordinator = new DesktopUpdateCoordinator(state => { states.push(state); return state },
      async () => allowRestart, updater, () => true, () => '1.0.0')
    coordinators.push(coordinator)
    return { coordinator, updater, states, quit: quit.promise, allow: () => { allowRestart = true } }
  }
  try {
    const current = join(root, 'current.AppImage')
    const marker = join(root, 'restarted.txt')
    process.env.APPIMAGE = current
    process.env.DSH_LINUX_UPDATE_MARKER = marker
    await writeFile(current, 'old application', { mode: 0o755 })
    const valid = await fixture('appimage', 'appimage')
    assert.deepEqual(await valid.coordinator.check(), { phase: 'available', version })
    assert.equal(requests.some(path => path === '/update.AppImage'), false, 'Checks must not download')
    assert.equal((await valid.coordinator.download(version)).phase, 'ready')
    assert.equal((await valid.coordinator.install(version)).phase, 'ready')
    assert.equal(await readFile(current, 'utf8'), 'old application', 'Cancelled confirmation must retain the old application')
    valid.allow()
    assert.equal((await valid.coordinator.install(version)).phase, 'installing')
    await valid.quit
    assert.deepEqual(await readFile(current), image)
    for (let attempt = 0; attempt < 50; attempt++) {
      try { assert.equal(await readFile(marker, 'utf8'), 'updated\n'); break } catch (error) {
        if (error.code !== 'ENOENT' || attempt === 49) throw error
        await new Promise(resolve => { setTimeout(resolve, 100) })
      }
    }
    const invalid = await fixture('corrupt', 'appimage')
    corrupt = true
    assert.equal((await invalid.coordinator.check()).phase, 'available')
    assert.equal((await invalid.coordinator.download(version)).phase, 'error')
    await assert.rejects(invalid.coordinator.install(version), /not ready/u)
    corrupt = false
    const debian = await fixture('debian', 'deb')
    assert.equal((await debian.coordinator.check()).phase, 'available')
    assert.equal((await debian.coordinator.download(version)).phase, 'ready')
    assert.deepEqual(await readFile(debian.updater.installerPath), deb)
    console.log('Linux updater: discovery, explicit download, SHA-512 rejection, cancelled install, AppImage replacement/relaunch and deb download passed')
  } finally {
    for (const coordinator of coordinators) coordinator.dispose()
    server.closeAllConnections()
    await new Promise(resolve => { server.close(resolve) })
  }
}

main().then(() => { app.exit(0) }, error => { console.error(error); app.exit(1) })
