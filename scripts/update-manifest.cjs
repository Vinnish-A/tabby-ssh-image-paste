const fs = require('node:fs')
const { createHash } = require('node:crypto')
const { version } = require('../package.json')
const sha256 = {}
for (const file of ['dist/index.js', 'LICENSE', 'package.json']) {
    sha256[file] = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}
fs.writeFileSync('update.json', JSON.stringify({ version, sha256 }, null, 2)+'\n')
