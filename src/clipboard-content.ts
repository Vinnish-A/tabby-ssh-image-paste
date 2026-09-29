import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

export type PastePart = { text: string } | { source: string } | { png: Buffer }

// A detached template is inert: clipboard HTML is never rendered or executed.
export function htmlParts(html: string, base = ''): PastePart[] {
    const template = document.createElement('template')
    const start = html.indexOf('<!--StartFragment-->')
    const end = html.indexOf('<!--EndFragment-->')
    template.innerHTML = start >= 0 && end > start ? html.slice(start + 20, end) : html
    const parts: PastePart[] = []
    const append = (text: string) => {
        const last = parts[parts.length - 1]
        if (last && 'text' in last) last.text += text
        else if (text) parts.push({ text })
    }
    const newline = () => {
        const last = parts[parts.length - 1]
        if (last && !('text' in last && last.text.endsWith('\n'))) append('\n')
    }
    const blocks = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'PRE', 'BLOCKQUOTE', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
    const walk = (node: Node, pre = false) => {
        if (node.nodeType === 3) {
            const text = node.textContent ?? ''
            append(pre ? text : text.replace(/[\t\r\n ]+/g, ' '))
            return
        }
        if (node.nodeType !== 1) return
        const el = node as HTMLElement
        const tag = el.tagName.toUpperCase()
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD', 'META', 'LINK'].includes(tag) || el.hidden) return
        if (tag === 'IMG' || tag === 'V:IMAGEDATA') {
            let source = el.getAttribute('src') || el.getAttribute('data-src') || ''
            if (source && base) { try { source = new URL(source, base).href } catch { /* Report at image loading. */ } }
            parts.push({ source })
            return
        }
        if (tag === 'BR') { append('\n'); return }
        if (blocks.has(tag)) newline()
        for (const child of Array.from(el.childNodes)) walk(child, pre || tag === 'PRE' || el.style.whiteSpace.startsWith('pre'))
        if (blocks.has(tag)) newline()
        if (tag === 'TD' || tag === 'TH') append('\t')
    }
    for (const node of Array.from(template.content.childNodes)) walk(node)
    // Block boundaries are separators, not extra leading/trailing paragraphs.
    if (parts[0] && 'text' in parts[0]) parts[0].text = parts[0].text.replace(/^\n+/, '')
    const last = parts[parts.length - 1]
    if (last && 'text' in last) last.text = last.text.replace(/\n+$/, '')
    return parts.filter(part => !('text' in part) || part.text !== '')
}

export function readParts(clipboard: any): PastePart[] {
    const html = clipboard.readHTML()
    if (html) {
        const header = clipboard.readBuffer('HTML Format').toString('utf8')
        const base = /^SourceURL:(.+)$/m.exec(header)?.[1].trim() ?? ''
        const parts = htmlParts(html, base)
        if (parts.some(part => 'source' in part)) return parts
    }
    const image = clipboard.readImage()
    if (image.isEmpty()) return [] // Ordinary text remains Tabby's responsibility.
    const text = clipboard.readText()
    return [...(text ? [{ text }] : []), { png: image.toPNG() }]
}

export async function imagePNG(source: string, nativeImage: any): Promise<Buffer> {
    let bytes: Buffer
    if (source.startsWith('file:')) {
        bytes = await fs.readFile(fileURLToPath(source))
    } else if (/^https?:/i.test(source)) {
        bytes = await downloadImage(source)
    } else if (/^data:image\//i.test(source)) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        try {
            const response = await fetch(source, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
            if (!response.ok) throw new Error(`Image download returned HTTP ${response.status}`)
            bytes = Buffer.from(await response.arrayBuffer())
        } finally { clearTimeout(timeout) }
    } else {
        throw new Error('Clipboard image has no accessible source (for example a private blob URL). Copy the original image instead.')
    }
    const image = nativeImage.createFromBuffer(bytes)
    if (image.isEmpty()) throw new Error('Clipboard image could not be decoded; nothing was pasted.')
    return image.toPNG()
}

// Main-process Chromium networking supports system proxies and image servers
// without CORS headers. Do not send browser cookies with copied image URLs.
function downloadImage(url: string): Promise<Buffer> {
    const { net } = require('@electron/remote')
    return new Promise((resolve, reject) => {
        const request = net.request({ url, credentials: 'omit', useSessionCookies: false })
        const timeout = setTimeout(() => { request.abort(); reject(new Error('Image download timed out')) }, 30000)
        request.on('error', (error: Error) => { clearTimeout(timeout); reject(error) })
        request.on('response', (response: any) => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                clearTimeout(timeout); request.abort()
                reject(new Error(`Image download returned HTTP ${response.statusCode}`))
                return
            }
            const chunks: Buffer[] = []
            let size = 0
            response.on('data', (chunk: Buffer) => {
                size += chunk.length
                if (size > 32 * 1024 * 1024) {
                    clearTimeout(timeout); request.abort(); reject(new Error('Clipboard image exceeds 32 MiB'))
                } else chunks.push(Buffer.from(chunk))
            })
            response.on('error', (error: Error) => { clearTimeout(timeout); reject(error) })
            response.on('end', () => { clearTimeout(timeout); resolve(Buffer.concat(chunks)) })
        })
        request.end()
    })
}
