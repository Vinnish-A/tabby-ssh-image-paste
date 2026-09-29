// Exercise the actual TypeScript service with only its host boundaries mocked.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const ts = require('typescript')
const { Subject } = require('rxjs')
let image = true
let rich = null
const clipboard = { readImage: () => ({ isEmpty: () => !image, toPNG: () => Buffer.from('PNG') }) }
const file = require('node:path').resolve('src/clipboard-sync.service.ts')
const moduleUnderTest = new Module(file, module)
moduleUnderTest.filename = file
moduleUnderTest.paths = module.paths
const normalRequire = moduleUnderTest.require.bind(moduleUnderTest)
moduleUnderTest.require = name => {
    if (name === './clipboard-content') return { readParts: () => rich ?? (image ? [{ png: Buffer.from('PNG') }] : []) }
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
    const removed = []
    const tab = { sshSession: { openSFTP: async () => ({ unlink: async path => removed.push(path) }) }, frontend: { supportsBracketedPaste: () => true }, sendInput: x => sent.push(x) }
    service.setActiveSession({}, tab)
    let finish
    service.sendViaSFTP = () => new Promise(resolve => { finish = resolve })
    const pending = service.pasteImage()
    service.setActiveSession({}, { sendInput: x => other.push(x) })
    finish()
    assert.equal(await pending, true)
    assert.match(sent[0], /^\x1b\[200~"\/tmp\/clipboard_[a-f0-9-]+\.png"\x1b\[201~$/)
    assert.deepEqual(other, [], 'focus change must not route the path into another server')
    service.setActiveSession({}, tab)
    service.sendViaSFTP = async () => { throw new Error('SFTP permission denied') }
    assert.equal(await service.pasteImage(), false)
    assert.match(errors[0], /SFTP permission denied/)
    image = false
    assert.equal(service.canPasteImage(), false)
    assert.equal(await service.pasteImage(), false)
    image = true
    service.setActiveSession({}, tab)
    sent.length = 0
    const uploads = []
    service.sendViaSFTP = async (_, data, path) => uploads.push({ data: data.toString(), path })
    rich = [{ text: 'before\n' }, { png: Buffer.from('one') }, { text: '\nbetween\n' }, { png: Buffer.from('two') }, { text: '\nafter' }]
    assert.equal(service.canPasteImage(), true)
    rich = [{ text: 'clipboard changed during upload' }]
    assert.equal(await service.pasteImage(), true)
    assert.deepEqual(uploads.map(x => x.data), ['one', 'two'])
    assert.notEqual(uploads[0].path, uploads[1].path)
    const events = [...sent[0].matchAll(/\x1b\[200~([\s\S]*?)\x1b\[201~/g)].map(x => x[1])
    assert.deepEqual(events, ['before\n', `"${uploads[0].path}"`, '\nbetween\n', `"${uploads[1].path}"`, '\nafter'])
    sent.length = 0
    rich = [{ png: Buffer.from('one') }, { png: Buffer.from('two') }]
    removed.length = 0
    let count = 0
    service.sendViaSFTP = async () => { if (++count === 2) throw new Error('second image failed') }
    assert.equal(await service.pasteImage(), false)
    assert.deepEqual(sent, [], 'a failed document must not be partly inserted')
    assert.equal(removed.length, 2, 'failed multi-image paste cleans only its own temporary files')
    console.log('PASS: mixed order, newlines, clipboard snapshot, unique paths, no partial paste')
    console.log('PASS: bracketed paste, original destination, visible upload errors, text-only passthrough')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
