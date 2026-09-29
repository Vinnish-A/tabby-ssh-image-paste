import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { ConfigService, NotificationsService } from 'tabby-core'
import { randomUUID } from 'crypto'
import { readParts, imagePNG, PastePart } from './clipboard-content'
import { ClipboardSyncConfig, DEFAULT_CONFIG } from './models/config.interface'

// Get Electron clipboard
const { clipboard, nativeImage } = require('@electron/remote')

interface SSHSession {
    profile: {
        options: {
            host: string
            port: number
            user: string
        }
    }
}

interface SessionContext {
    session: SSHSession
    tab: any
}

@Injectable({ providedIn: 'root' })
export class ClipboardSyncService {
    private activeContext: SessionContext | null = null
    private config: ClipboardSyncConfig
    private pendingParts: PastePart[] | null = null
    private pasting = false

    readonly imagePasted$ = new Subject<{ path: string }>()
    readonly error$ = new Subject<{ message: string }>()

    constructor(
        private configService: ConfigService,
        private notifications: NotificationsService,
    ) {
        const store = this.configService.store
        this.config = store?.clipboardSync ?? { ...DEFAULT_CONFIG }

        this.configService.changed$.subscribe(() => {
            this.config = this.configService.store?.clipboardSync ?? { ...DEFAULT_CONFIG }
        })
    }

    /**
     * Set active SSH session for clipboard sync
     */
    setActiveSession(session: SSHSession, tab: any): void {

        this.activeContext = { session, tab }
    }

    clearActiveSession(): void {

        this.activeContext = null
    }

    hasActiveSession(): boolean {
        return this.activeContext !== null
    }

    canPasteImage(): boolean {
        this.pendingParts = this.config.enabled && this.activeContext ? readParts(clipboard) : null
        return !!this.pendingParts?.length
    }

    async pasteImage(): Promise<boolean> {
        const context = this.activeContext
        if (!context || !this.config.enabled) return false
        const parts = this.pendingParts ?? readParts(clipboard)
        this.pendingParts = null
        if (!parts.length) return false
        if (this.pasting) return true
        this.pasting = true
        const paths: string[] = []
        let inputStarted = false
        try {
            const bracketed = context.tab.frontend?.supportsBracketedPaste?.()
            if (parts.length > 1 && !bracketed) throw new Error('Mixed image/text paste requires bracketed paste. Open the Codex input first.')
            const chunks: string[] = []
            // Finish every upload before changing the input; a failed image must
            // not silently leave a partially pasted document in the composer.
            for (const part of parts) {
                let text: string
                if ('text' in part) {
                    text = part.text.replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
                } else {
                    const data = 'png' in part ? part.png : await imagePNG(part.source, nativeImage)
                    const path = `/tmp/clipboard_${randomUUID()}.png`
                    paths.push(path)
                    await this.sendViaSFTP(context.tab, data, path)
                    text = `"${path}"`
                }
                // Separate paste events let Codex recognize each image path as
                // an attachment while retaining text before and after it.
                chunks.push(bracketed ? `\x1b[200~${text}\x1b[201~` : text)
            }
            inputStarted = true
            await this.writeToTerminal(context.tab, chunks.join(''))
            for (const path of paths) this.imagePasted$.next({ path })
            if (this.config.showNotifications) this.notifications.info(`${paths.length} image(s) pasted`)
            return true
        } catch (error) {
            if (!inputStarted && paths.length) {
                try {
                    const sftp = await context.tab.sshSession.openSFTP()
                    await Promise.all(paths.map(path => sftp.unlink(path).catch((e: Error) => console.warn('Image cleanup:', String(e)))))
                } catch (cleanup) { console.warn('Image cleanup:', String(cleanup)) }
            }
            this.error$.next({ message: String(error) })
            this.notifications.error(`Image paste failed: ${String(error)}`)
            return false
        } finally { this.pasting = false }
    }

    private async sendViaSFTP(tab: any, data: Buffer, remotePath: string): Promise<void> {
        // Get SSH session - Tabby uses sshSession property
        const sshSession = tab.sshSession
        
        if (!sshSession) {
            throw new Error('No SSH session available')
        }

        if (!sshSession.openSFTP) {
            throw new Error('SFTP not supported on this session')
        }

        const sftp = await sshSession.openSFTP()
        // Flags: WRITE (0x02) | CREATE (0x08) | TRUNCATE (0x10)
        const OPEN_WRITE = 0x02
        const OPEN_CREATE = 0x08
        const OPEN_TRUNCATE = 0x10
        const handle = await sftp.open(remotePath, OPEN_WRITE | OPEN_CREATE | OPEN_TRUNCATE)
        
        try {
            await handle.write(new Uint8Array(data))
        } finally {
            await handle.close()
        }
    }

    private async writeToTerminal(tab: any, text: string): Promise<void> {
        // Try multiple methods to write to terminal
        // Write to the SSH input, never to the local display.
        
        if (tab.sendInput) {
            tab.sendInput(text)
            return
        }
        
        const session = tab.session || tab.sshSession
        if (session?.write) {
            const data = Buffer.from(text, 'utf8')
            session.write(data)
            return
        }
        
        if (tab.write) {
            tab.write(text)
            return
        }

        throw new Error('No write method available')
    }

}
