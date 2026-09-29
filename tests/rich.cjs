// Run inside a Tabby renderer: require('<repo>/tests/rich.cjs')().
// Uses the real inert DOM parser and Electron image decoder, never renders HTML.
const fs = require('fs'), path = require('path'), Module = require('module')
const assert = require('assert/strict'), ts = require('typescript')
module.exports = async function (network = false) {
    const file = path.resolve(__dirname, '../src/clipboard-content.ts')
    const loaded = new Module(file, module)
    loaded.filename = file; loaded.paths = module.paths
    loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText, file)
    const { htmlParts, imagePNG, readParts } = loaded.exports
    assert.deepEqual(htmlParts('<p>甲<img src="a.png">乙<br>丙</p><p><img src="b.png">丁</p>', 'https://example.org/page'), [
        { text: '甲' }, { source: 'https://example.org/a.png' }, { text: '乙\n丙\n' },
        { source: 'https://example.org/b.png' }, { text: '丁' },
    ])
    assert.deepEqual(htmlParts('outside<!--StartFragment--><pre>a  b\nc</pre><script>BAD</script><img src="data:image/png;base64,AA=="><!--EndFragment-->outside'), [
        { text: 'a  b\nc\n' }, { source: 'data:image/png;base64,AA==' },
    ])
    assert.deepEqual(htmlParts('<p>Word<v:imagedata src="file:///C:/test.png"></v:imagedata>end</p>'), [
        { text: 'Word' }, { source: 'file:///C:/test.png' }, { text: 'end' },
    ])
    const nativeImage = require('@electron/remote').nativeImage
    const source = nativeImage.createFromBitmap(Buffer.from([0, 255, 0, 255]), { width: 1, height: 1 }).toDataURL()
    const result = await imagePNG(source, nativeImage)
    assert.equal(nativeImage.createFromBuffer(result).isEmpty(), false)
    if (network) assert.equal(nativeImage.createFromBuffer(await imagePNG('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', nativeImage)).isEmpty(), false)
    await assert.rejects(imagePNG('blob:https://example.org/private', nativeImage), /accessible source/)
    const image = { isEmpty: () => false, toPNG: () => result }
    assert.deepEqual(readParts({ readHTML: () => '', readText: () => 'caption', readImage: () => image }), [{ text: 'caption' }, { png: result }])
    return 'PASS: HTML order, paragraphs, fragment selection, inert scripts, Word file reference, image decoding, inaccessible image error'
}
