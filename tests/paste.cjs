// Exercise the actual TypeScript service with only its host boundaries mocked.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const ts = require('typescript')
const { Subject } = require('rxjs')
let image = true
const clipboard = { readImage: () => ({ isEmpty: () => !image, toPNG: () => Buffer.from('PNG') }) }
const file = require('node:path').resolve('src/clipboard-sync.service.ts')
const moduleUnderTest = new Module(file, module)
moduleUnderTest.filename = file
moduleUnderTest.paths = module.paths
const normalRequire = moduleUnderTest.require.bind(moduleUnderTest)
moduleUnderTest.require = name => {
    if (name === './update') return { checkForUpdate: async () => {} }
    if (name === '@angular/core') return { Injectable: () => target => target }
    if (name === '@electron/remote') return { clipboard }
    if (name === 'tabby-core') return {}
    if (name === './models/config.interface') return { DEFAULT_CONFIG: { enabled: true, showNotifications: true } }
    return normalRequire(name)
}
moduleUnderTest._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText, file)
const Service = moduleUnderTest.exports.ClipboardSyncService

async function main () {
    const errors = []
    const service = new Service({ store: {}, changed$: new Subject() }, { info () {}, error: x => errors.push(x) })
    const sent = [], other = []
    const tab = { frontend: { supportsBracketedPaste: () => true }, sendInput: x => sent.push(x) }
    service.setActiveSession({}, tab)
    let finish
    service.sendViaSFTP = () => new Promise(resolve => { finish = resolve })
    const pending = service.pasteImage()
    service.setActiveSession({}, { sendInput: x => other.push(x) })
    finish()
    assert.equal(await pending, true)
    assert.match(sent[0], /^\x1b\[200~"\/tmp\/clipboard_\d+\.png"\x1b\[201~$/)
    assert.deepEqual(other, [], 'focus change must not route the path into another server')
    service.sendViaSFTP = async () => { throw new Error('SFTP permission denied') }
    assert.equal(await service.pasteImage(), false)
    assert.match(errors[0], /SFTP permission denied/)
    image = false
    assert.equal(service.canPasteImage(), false)
    assert.equal(await service.pasteImage(), false)
    console.log('PASS: bracketed paste, original destination, visible upload errors, text-only passthrough')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
