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
        if (tab.profile?.type !== 'ssh' || this.restore.has(tab)) return
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
        // Bind ownership to the terminal that received the event, not the
        // asynchronously updated global active/focused tab (split panes/RDP).
        const terminal = tab.frontend.xterm.element as HTMLElement
        let held = false
        const onKey = (event: KeyboardEvent): void => {
            if (event.key.toLowerCase() !== 'v' && event.code !== 'KeyV'
                && !(event.type === 'keypress' && event.charCode === 22)) return
            const inside = event.target instanceof Element && terminal.contains(event.target)
            const shortcut = (event.ctrlKey || event.metaKey) && !event.altKey
            if (event.type !== 'keydown') {
                if (!held && !(inside && shortcut)) return
                if (event.type === 'keyup') held = false
            } else {
                if (!inside || !shortcut) return
                held = true
                event.preventDefault()
                event.stopImmediatePropagation()
                if (!event.repeat) void tab.paste()
                return
            }
            // Windows clipboard reads can pump a queued keypress reentrantly.
            // xterm passes keypress/keyup to Tabby as keydown: consume both,
            // including unmatched/repeated releases from RDP focus changes.
            event.preventDefault()
            event.stopImmediatePropagation()
        }
        window.addEventListener('keydown', onKey, true)
        window.addEventListener('keyup', onKey, true)
        window.addEventListener('keypress', onKey, true)
        this.restore.set(tab, () => {
            window.removeEventListener('keydown', onKey, true)
            window.removeEventListener('keyup', onKey, true)
            window.removeEventListener('keypress', onKey, true)
            tab.paste = paste
            tab.buildContextMenu = menu
        })
    }

    detach(tab: any): void {
        this.restore.get(tab)?.()
        this.restore.delete(tab)
        super.detach(tab)
    }
}
