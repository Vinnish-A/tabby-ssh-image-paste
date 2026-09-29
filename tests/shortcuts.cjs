const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript')
const listeners = new Map([['keydown', new Set()], ['keyup', new Set()], ['keypress', new Set()]])
global.window = {
    addEventListener: (type, fn) => listeners.get(type).add(fn),
    removeEventListener: (type, fn) => listeners.get(type).delete(fn),
}
global.Element = class { contains (other) { return other === this } }
const file = path.resolve('src/ssh-terminal.ts'), loaded = new Module(file, module)
loaded.filename = file; loaded.paths = module.paths
loaded.require = name => {
    if (name === '@angular/core') return { Injectable: () => target => target }
    if (name === 'tabby-terminal') return { TerminalDecorator: class { detach () {} } }
    return {}
}
loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText, file)
let destination
const service = { setActiveSession: (_, tab) => { destination = tab }, canPasteImage: () => false }
const decorator = new loaded.exports.SSHTerminalDecorator(service, { instant: x => x })
function tab () {
    const t = { profile: { type: 'ssh' }, sshSession: {}, calls: 0,
        frontend: { xterm: { element: new Element() } },
        paste: async () => { t.calls++ }, buildContextMenu: async () => [] }
    decorator.attach(t)
    return t
}
const first = tab(), second = tab()
function event (type, target = first, extra = {}) {
    const e = { type, key: 'V', code: 'KeyV', ctrlKey: true, altKey: false, repeat: false,
        target: target?.frontend.xterm.element ?? new Element(),
        preventDefault () { this.prevented = true }, stopImmediatePropagation () { this.stopped = true }, ...extra }
    for (const fn of listeners.get(type)) { fn(e); if (e.stopped) break }
    return e
}
for (const shiftKey of [false, true]) {
    let before = first.calls
    assert.ok(event('keydown', first, { shiftKey }).stopped)
    assert.ok(event('keydown', first, { shiftKey, repeat: true }).stopped)
    assert.ok(event('keypress', first, { shiftKey }).stopped)
    assert.ok(event('keypress', first, { key: '\x16', code: '', charCode: 22 }).stopped)
    assert.ok(event('keyup', null, { ctrlKey: false }).stopped)
    assert.equal(first.calls, before + 1)
    assert.ok(event('keyup').stopped, 'duplicate V release must not reach the xterm hotkey handler')
    assert.equal(first.calls, before + 1)
    event('keydown', first, { shiftKey }); event('keyup')
    assert.equal(first.calls, before + 2, 'a deliberate second press must remain separate')
}
event('keydown', second); event('keyup', second)
assert.equal(second.calls, 1); assert.equal(destination, second, 'event target owns paste regardless of global focus')
event('keydown', second, { key: 'Process' }); event('keyup', second, { key: 'Process' })
assert.equal(second.calls, 2, 'physical KeyV must work with IME key names')
for (const extra of [{ key: 'C', code: 'KeyC', shiftKey: true }, { altKey: true }, { ctrlKey: false }]) {
    assert.ok(!event('keydown', first, extra).stopped)
}
assert.ok(!event('keydown', null).stopped, 'settings/search fields remain native')
const original = first.paste
let injected = false
first.paste = () => {
    if (!injected) {
        injected = true
        const press = event('keypress', first)
        if (!press.stopped) first.paste() // Tabby's xterm hotkey reenters paste.
    }
    return original()
}
const beforeReentry = first.calls
event('keydown', first); event('keyup', first)
assert.equal(first.calls, beforeReentry + 1, 'clipboard read must not reenter paste via keypress')
decorator.attach(first)
assert.equal(listeners.get('keydown').size, 2, 'reattach must not stack wrappers')
decorator.detach(first); decorator.detach(second)
assert.equal(listeners.get('keydown').size, 0); assert.equal(listeners.get('keyup').size, 0); assert.equal(listeners.get('keypress').size, 0)
console.log('PASS: terminal ownership, IME, repeated releases, repeat keys, separate presses, reattach and cleanup; copy untouched')
