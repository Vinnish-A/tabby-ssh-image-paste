const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const Module = require('node:module')
const ts = require('typescript')
const { createHash } = require('node:crypto')
const file = path.resolve('src/update.ts')
const loaded = new Module(file, module)
loaded.filename = file
loaded.paths = module.paths
loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file)
const { applyUpdate, newer } = loaded.exports

async function main () {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tabby-image-update-test-'))
    try {
        fs.mkdirSync(path.join(temp, 'dist'))
        fs.writeFileSync(path.join(temp, 'dist/index.js'), 'OLD')
        fs.writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ version: '0.1.2' }))
        const data = {
            'dist/index.js': Buffer.from('NEW'),
            'LICENSE': Buffer.from('MIT'),
            'package.json': Buffer.from(JSON.stringify({ name: 'tabby-ssh-image-paste', version: '0.1.3', main: 'dist/index.js' })),
        }
        const manifest = { version: '0.1.3', sha256: {} }
        for (const [name, bytes] of Object.entries(data)) manifest.sha256[name] = createHash('sha256').update(bytes).digest('hex')
        await assert.rejects(applyUpdate(temp, manifest, async name => name === 'dist/index.js' ? Buffer.from('TAMPERED') : data[name]), /checksum/)
        assert.equal(fs.readFileSync(path.join(temp, 'dist/index.js'), 'utf8'), 'OLD')
        await assert.rejects(applyUpdate(temp, manifest, async () => { throw new Error('offline') }), /offline/)
        assert.equal(await applyUpdate(temp, manifest, async name => data[name]), true)
        assert.equal(fs.readFileSync(path.join(temp, 'dist/index.js'), 'utf8'), 'NEW')
        assert.equal(JSON.parse(fs.readFileSync(path.join(temp, 'package.json'))).version, '0.1.3')
        assert.equal(await applyUpdate(temp, manifest, async () => { throw new Error('should not download') }), false)
        assert.equal(newer('0.1.9', '0.2.0'), false)
        assert.throws(() => newer('../main', '0.1.0'))
        assert.equal(fs.readdirSync(temp).some(x => x.startsWith('.update-')), false)
        console.log('PASS: checksum rejection, failed download safety, update, no downgrade, cleanup')
    } finally { fs.rmSync(temp, { recursive: true, force: true }) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
