import { promises as fs } from 'fs'
import { get } from 'https'
import { join, resolve } from 'path'
import { createHash } from 'crypto'

const repository = 'https://raw.githubusercontent.com/Vinnish-A/tabby-ssh-image-paste'
const files = ['dist/index.js', 'LICENSE', 'package.json'] as const
interface Manifest { version: string; sha256: Record<string, string> }

function version(value: string): number[] {
    if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error('Invalid update version')
    return value.split('.').map(Number)
}
export function newer(candidate: string, current: string): boolean {
    const a = version(candidate), b = version(current)
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
    return false
}
function download(url: string): Promise<Buffer> {
    return new Promise((resolveDownload, reject) => {
        const request = get(url, response => {
            if (response.statusCode !== 200) {
                response.resume()
                reject(new Error(`Update download returned HTTP ${response.statusCode}`))
                return
            }
            const chunks: Buffer[] = []
            let size = 0
            response.on('data', (chunk: Buffer) => {
                size += chunk.length
                if (size > 2 * 1024 * 1024) request.destroy(new Error('Update file exceeds 2 MiB'))
                else chunks.push(chunk)
            })
            response.on('end', () => resolveDownload(Buffer.concat(chunks)))
            response.on('error', reject)
        })
        request.setTimeout(10000, () => request.destroy(new Error('Update download timed out')))
        request.on('error', reject)
    })
}

// Download a tagged, checksum-verified bundle before replacing any installed file.
// The JS currently loaded by an existing window is left running unchanged.
export async function applyUpdate(root: string, manifest: Manifest,
    fetchFile: (file: string) => Promise<Buffer>): Promise<boolean> {
    const installed = JSON.parse(await fs.readFile(join(root, 'package.json'), 'utf8'))
    if (!newer(manifest.version, installed.version)) return false
    const data = await Promise.all(files.map(fetchFile))
    for (let i = 0; i < files.length; i++) {
        if (createHash('sha256').update(data[i]).digest('hex') !== manifest.sha256[files[i]]) {
            throw new Error(`Update checksum mismatch: ${files[i]}`)
        }
    }
    const pkg = JSON.parse(data[2].toString())
    if (pkg.name !== 'tabby-ssh-image-paste' || pkg.version !== manifest.version || pkg.main !== 'dist/index.js'
        || Object.keys(pkg.dependencies ?? {}).length) throw new Error('Unsupported update package')
    const stage = await fs.mkdtemp(join(root, '.update-'))
    try {
        for (let i = 0; i < files.length; i++) await fs.writeFile(join(stage, String(i)), data[i])
        // Commit the version last: an interrupted update remains eligible for retry.
        for (let i = 0; i < files.length; i++) await fs.rename(join(stage, String(i)), join(root, files[i]))
    } finally {
        await fs.rm(stage, { recursive: true, force: true })
    }
    return true
}

export async function checkForUpdate(notify: (message: string) => void): Promise<void> {
    const root = resolve(__dirname, '..')
    const marker = join(root, '.update-check')
    try {
        if (Date.now() - (await fs.stat(marker)).mtimeMs < 24 * 60 * 60 * 1000) return
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    const lockPath = join(root, '.update-lock')
    // A crashed renderer must not disable updates forever.
    try {
        if (Date.now() - (await fs.stat(lockPath)).mtimeMs > 5 * 60 * 1000) await fs.unlink(lockPath)
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    let lock
    try { lock = await fs.open(lockPath, 'wx') }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') return; throw error }
    try {
        const manifest: Manifest = JSON.parse((await download(`${repository}/main/update.json`)).toString())
        version(manifest.version)
        const updated = await applyUpdate(root, manifest, file => download(`${repository}/v${manifest.version}/${file}`))
        await fs.writeFile(marker, String(Date.now()))
        if (updated) notify(`SSH Image Paste updated to ${manifest.version}. Reopen Tabby to use it; existing SSH sessions are unchanged.`)
    } finally {
        await lock.close()
        await fs.unlink(lockPath)
    }
}
