/** Exercise real deb update checks and downloads without installing a system package. */
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
const deb = Buffer.from('inert deb download fixture; never installed')
const digest = bytes => createHash('sha512').update(bytes).digest('base64')
const requests = []
let corrupt = false
const server = createServer((request, response) => {
  requests.push(request.url)
  if (request.url?.startsWith('/nightly-linux')) {
    response.setHeader('Content-Type', 'application/yaml')
    const sha512 = digest(corrupt ? Buffer.from('wrong') : deb)
    response.end(JSON.stringify({ version, releaseDate: '2026-11-03T00:00:00.000Z',
      files: [{ url: 'update.deb', sha512, size: deb.length }], path: 'update.deb', sha512 }))
  } else if (request.url === '/update.deb') response.end(deb)
  else { response.statusCode = 404; response.end() }
})
const coordinators = []

async function main() {
  await app.whenReady()
  await new Promise(resolve => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const url = `http://127.0.0.1:${address.port}/`
  async function fixture(name) {
    const directory = join(root, name)
    await mkdir(directory, { recursive: true })
    const config = join(directory, 'app-update.yml')
    await writeFile(config, JSON.stringify({ provider: 'generic', url, updaterCacheDirName: name }))
    const adapter = { version: '1.0.0', name, isPackaged: true, appUpdateConfigPath: config,
      userDataPath: directory, baseCachePath: directory, whenReady: async () => {},
      quit: () => { throw new Error('Unexpected application quit') },
      relaunch: () => { throw new Error('Unexpected system relaunch') },
      onQuit: () => { throw new Error('Implicit installation is forbidden') } }
    const updater = new updaterModule.DebUpdater(undefined, adapter)
    updater.logger = null
    updater.httpExecutor = new DesktopUpdateHttpExecutor(10_000)
    updater.setFeedURL({ provider: 'generic', url })
    // Keep the real metadata, download, and checksum paths; intercept only the system install handoff.
    const installs = []
    updater.quitAndInstall = (...args) => { installs.push(args) }
    let allowRestart = false
    const states = []
    const coordinator = new DesktopUpdateCoordinator(state => { states.push(state); return state },
      async () => allowRestart, updater, () => true, () => '1.0.0')
    coordinators.push(coordinator)
    return { coordinator, updater, states, installs, allow: () => { allowRestart = true } }
  }
  try {
    const valid = await fixture('debian')
    assert.deepEqual(await valid.coordinator.check(), { phase: 'available', version })
    assert.equal(requests.some(path => path === '/update.deb'), false, 'Checks must not download')
    assert.equal((await valid.coordinator.download(version)).phase, 'ready')
    assert.ok(requests.includes('/update.deb'), 'Explicit download must fetch the deb')
    assert.deepEqual(await readFile(valid.updater.installerPath), deb)
    assert.equal((await valid.coordinator.install(version)).phase, 'ready')
    assert.deepEqual(valid.installs, [], 'Cancelled confirmation must not invoke the installer')
    assert.deepEqual(await readFile(valid.updater.installerPath), deb, 'Cancelled confirmation must retain the downloaded package')
    valid.allow()
    assert.equal((await valid.coordinator.install(version)).phase, 'installing')
    assert.deepEqual(valid.installs, [[true, true]], 'Confirmed installation must delegate silent install and restart')

    corrupt = true
    const invalid = await fixture('corrupt')
    assert.equal((await invalid.coordinator.check()).phase, 'available')
    const failed = await invalid.coordinator.download(version)
    assert.equal(failed.phase, 'error')
    assert.equal(failed.failedOperation, 'download')
    assert.match(failed.message, /sha512 checksum mismatch/iu)
    await assert.rejects(invalid.coordinator.install(version), /not ready/u)
    assert.deepEqual(invalid.installs, [], 'Checksum rejection must prevent system installation')
    console.log('Linux deb updater: discovery, explicit download, SHA-512 rejection, cancelled install and confirmed install handoff passed; no system package installed')
  } finally {
    for (const coordinator of coordinators) coordinator.dispose()
    server.closeAllConnections()
    await new Promise(resolve => { server.close(resolve) })
  }
}

main().then(() => { app.exit(0) }, error => { console.error(error); app.exit(1) })
