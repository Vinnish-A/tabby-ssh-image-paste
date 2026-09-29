import { Injectable } from '@angular/core'
import { TranslateService } from 'tabby-core'
import { TerminalDecorator } from 'tabby-terminal'
import { ClipboardSyncService } from './clipboard-sync.service'

// Use Tabby's own paste entry point for context-menu and custom hotkey pastes.
// Do not bind right mouse buttons: menu/paste preferences belong to the client.
@Injectable()
export class SSHTerminalDecorator extends TerminalDecorator {
    private restore = new WeakMap<object, () => void>()
    constructor(private clipboardSync: ClipboardSyncService, private translate: TranslateService) { super() }

    attach(tab: any): void {
        if (tab.profile?.type !== 'ssh') return
        const paste = tab.paste
        const menu = tab.buildContextMenu
        tab.paste = async () => {
            if (tab.sshSession) this.clipboardSync.setActiveSession(tab.sshSession, tab)
            else this.clipboardSync.clearActiveSession()
            if (this.clipboardSync.canPasteImage()) await this.clipboardSync.pasteImage()
            else await paste.call(tab)
        }
        tab.buildContextMenu = async () => {
            const items = (await menu.call(tab)).filter((item: any) => item.label !== this.translate.instant('Export to file'))
            return items.filter((item: any, i: number) => item.type !== 'separator' || (i > 0 && i < items.length - 1 && items[i - 1].type !== 'separator'))
        }
        this.restore.set(tab, () => { tab.paste = paste; tab.buildContextMenu = menu })
    }

    detach(tab: any): void {
        this.restore.get(tab)?.()
        this.restore.delete(tab)
        super.detach(tab)
    }
}
