import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { ConfigService, NotificationsService } from 'tabby-core'
import { checkForUpdate } from './update'
import { ClipboardSyncConfig, DEFAULT_CONFIG } from './models/config.interface'

// Get Electron clipboard
const { clipboard } = require('@electron/remote')

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

    readonly imagePasted$ = new Subject<{ path: string }>()
    readonly error$ = new Subject<{ message: string }>()

    constructor(
        private configService: ConfigService,
        private notifications: NotificationsService,
    ) {
        const store = this.configService.store
        this.config = store?.clipboardSync ?? { ...DEFAULT_CONFIG }

        if (this.config.autoUpdate !== false) {
            void checkForUpdate(message => this.notifications.info(message))
                .catch(error => console.warn('SSH Image Paste update check:', String(error)))
        }

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
        return this.config.enabled && this.activeContext !== null && !clipboard.readImage().isEmpty()
    }

    /**
     * Handle Ctrl+Shift+V - paste image from clipboard
     * Returns true if handled (image or text pasted)
     */
    async pasteImage(): Promise<boolean> {
        const context = this.activeContext
        if (!context) {

            return false
        }

        if (!this.config.enabled) {

            return false
        }

        // Check if clipboard has image
        const image = clipboard.readImage()
        if (image.isEmpty()) {

            return false // Let Tabby handle normal paste
        }



        try {
            const imageData = image.toPNG()

            // Send image to server
            const filePath = await this.sendImageToServer(context, imageData)
            
            // Input file path to terminal
            await this.inputToTerminal(context.tab, filePath)
            
            this.imagePasted$.next({ path: filePath })
            
            if (this.config.showNotifications) {
                this.notifications.info(`Image uploaded: ${filePath}`)
            }

            return true

        } catch (error) {

            this.error$.next({ message: String(error) })
            this.notifications.error(`Image upload failed: ${String(error)}`)
            return false
        }
    }

    private async sendImageToServer(context: SessionContext, imageData: Buffer): Promise<string> {
        const timestamp = Date.now()
        const filename = `/tmp/clipboard_${timestamp}.png`



        try {
            await this.sendViaSFTP(context.tab, imageData, filename)
        } catch (error) {

            throw error
        }

        return filename
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

    private async inputToTerminal(tab: any, filePath: string): Promise<void> {
        // Just input the file path (user can use it with Claude Code / OpenCode)
        // Wrap in quotes to prevent shell interpretation of slashes
        let text = `"${filePath}"`
        if (tab.frontend?.supportsBracketedPaste?.()) {
            text = `\x1b[200~${text}\x1b[201~`
        }
        await this.writeToTerminal(tab, text)
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
