// Exercise capture ordering: an unclaimed event reaches both Tabby's hotkey
// and Chromium's native paste; a handled key must reach neither.
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript')
const listeners = new Map()
global.document = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: type => listeners.delete(type),
}
global.Element = class { constructor (terminal) { this.terminal = terminal } closest () { return this.terminal } }
const file = path.resolve('src/index.ts'), loaded = new Module(file, module)
loaded.filename = file; loaded.paths = module.paths
loaded.require = name => name === '@angular/core' ? { NgModule: () => target => target } : {}
loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText, file)
let calls = 0
const tab = { profile: { type: 'ssh' }, paste: () => { calls++ } }
const app = { activeTab: { getFocusedTab: () => tab } }
const plugin = new loaded.exports.default({}, app)
function event (type, extra = {}) {
    const e = { type, key: 'V', ctrlKey: true, altKey: false, repeat: false,
        target: new Element(true), preventDefault () { this.prevented = true },
        stopImmediatePropagation () { this.stopped = true }, ...extra }
    listeners.get(type)(e)
    return e
}
for (const shiftKey of [false, true]) {
    let before = calls
    assert.ok(event('keydown', { shiftKey }).stopped)
    assert.ok(event('keydown', { shiftKey, repeat: true }).stopped)
    // Releasing Ctrl first or changing focus must not let the V release paste.
    assert.ok(event('keyup', { ctrlKey: false, target: new Element(false) }).stopped)
    assert.equal(calls, before + 1)
    event('keydown', { shiftKey }); event('keyup')
    assert.equal(calls, before + 2, 'a deliberate second press must not be debounced')
}
for (const extra of [{ key: 'C', shiftKey: true }, { altKey: true }, { target: new Element(false) }, { ctrlKey: false }]) {
    assert.ok(!event('keydown', extra).stopped)
}
app.activeTab = { profile: { type: 'local' }, paste: () => { throw Error('must stay native') } }
assert.ok(!event('keydown').stopped)
plugin.ngOnDestroy(); assert.equal(listeners.size, 0)
console.log('PASS: one paste per press, repeat/release consumed, successive presses preserved; copy/nonterminal/local untouched')
