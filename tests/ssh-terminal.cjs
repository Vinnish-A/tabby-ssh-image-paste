const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript')
const file = path.resolve('src/ssh-terminal.ts')
const loaded = new Module(file, module)
loaded.filename = file; loaded.paths = module.paths
const normalRequire = loaded.require.bind(loaded)
loaded.require = name => {
    if (name === '@angular/core') return { Injectable: () => target => target }
    if (name === 'tabby-terminal') return { TerminalDecorator: class { detach () {} } }
    if (name === 'tabby-core' || name === './clipboard-sync.service') return {}
    return normalRequire(name)
}
loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText, file)
async function main () {
    let image = true, uploads = 0, plain = 0, destination
    const service = {
        setActiveSession: (_, tab) => { destination = tab }, clearActiveSession: () => {},
        canPasteImage: () => image, pasteImage: async () => { uploads++ },
    }
    const decorator = new loaded.exports.SSHTerminalDecorator(service, { instant: x => x })
    const paste = async () => { plain++ }
    const menu = async () => [{ label: 'Copy' }, { type: 'separator' }, { label: 'Export to file' }, { type: 'separator' }, { label: 'Paste' }]
    const tab = { profile: { type: 'ssh' }, sshSession: {}, paste, buildContextMenu: menu }
    decorator.attach(tab)
    await tab.paste()
    assert.equal(destination, tab); assert.equal(uploads, 1); assert.equal(plain, 0)
    image = false
    await tab.paste()
    assert.equal(plain, 1)
    assert.deepEqual(await tab.buildContextMenu(), [{ label: 'Copy' }, { type: 'separator' }, { label: 'Paste' }])
    decorator.detach(tab)
    assert.equal(tab.paste, paste); assert.equal(tab.buildContextMenu, menu)
    const local = { ...tab, profile: { type: 'local' } }
    decorator.attach(local); assert.equal(local.paste, paste)
    console.log('PASS: shared paste entry, no duplicate text, SSH-only menu filtering, restoration')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
