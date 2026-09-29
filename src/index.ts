import { CommonModule } from '@angular/common'
import { NgModule, OnDestroy } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ConfigProvider, AppService, BaseTabComponent, HotkeysService } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'
import { Subscription } from 'rxjs'
import { ClipboardSyncConfigProvider } from './providers/config.provider'
import { ClipboardSyncSettingsTabComponent, ClipboardSyncSettingsTabProvider } from './settings'
import { ClipboardSyncService } from './clipboard-sync.service'

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
    ],
    declarations: [
        ClipboardSyncSettingsTabComponent,
    ],
    providers: [
        { provide: ConfigProvider, useClass: ClipboardSyncConfigProvider, multi: true },
        { provide: SettingsTabProvider, useClass: ClipboardSyncSettingsTabProvider, multi: true },
        ClipboardSyncService,
    ],
})
export default class ClipboardSyncModule implements OnDestroy {
    private subscriptions: Subscription[] = []

    constructor(
        private clipboardSync: ClipboardSyncService,
        private app: AppService,
        private hotkeys: HotkeysService,
    ) {
        this.initializeTabWatcher()
        this.initializePasteHook()
    }

    private initializePasteHook(): void {
        // Refresh on paste: the first SSH child may become ready after tab events.
        const sub = this.hotkeys.hotkey$.subscribe(async hotkey => {
            if (hotkey === 'paste') {
                this.checkAndSetActiveSession(this.app.activeTab, false)
                await this.clipboardSync.pasteImage()
            }
        })
        this.subscriptions.push(sub)
    }

    private initializeTabWatcher(): void {
        const appService = this.app as any

        // Watch for active tab changes
        if (appService.activeTabChange$) {
            const sub = appService.activeTabChange$.subscribe(() => {
                if (appService.activeTab) {
                    this.checkAndSetActiveSession(appService.activeTab)
                }
            })
            this.subscriptions.push(sub)
        }

        // Watch for new tabs being opened - this catches the first SSH tab
        if (appService.tabOpened$) {
            const sub = appService.tabOpened$.subscribe((tab: BaseTabComponent) => {
                this.watchTabForSession(tab)
            })
            this.subscriptions.push(sub)
        }
    }

    private watchTabForSession(tab: BaseTabComponent): void {
        const tabAny = tab as any
        const appService = this.app as any

        const tabType = tab.constructor.name
        const isSSHTab = tabType.includes('SSH') ||
                         tabType.includes('Ssh') ||
                         tabAny.profile?.type === 'ssh'

        if (!isSSHTab) return

        if (tabAny.sshSession && tab === appService.activeTab) {
            this.clipboardSync.setActiveSession(tabAny.sshSession, tabAny)
            return
        }

        if (tabAny.sessionChanged$) {
            const sub = tabAny.sessionChanged$.subscribe(() => {
                if (tabAny.sshSession && tab === appService.activeTab) {
                    this.clipboardSync.setActiveSession(tabAny.sshSession, tabAny)
                }
            })
            this.subscriptions.push(sub)
        }

        if (tabAny.sshSessionReady$) {
            const sub = tabAny.sshSessionReady$.subscribe(() => {
                if (tabAny.sshSession && tab === appService.activeTab) {
                    this.clipboardSync.setActiveSession(tabAny.sshSession, tabAny)
                }
            })
            this.subscriptions.push(sub)
        }
    }

    private checkAndSetActiveSession(tab: BaseTabComponent | null, watch = true): void {
        if (!tab) {
            this.clipboardSync.clearActiveSession()
            return
        }

        const tabAny = tab as any
        const tabType = tab.constructor.name

        // If it's a SplitTabComponent, check its focused child
        if (tabType === 'SplitTabComponent') {
            const focusedTab = tabAny.getFocusedTab?.()
            const allTabs = tabAny.getAllTabs?.()

            // Watch for focus changes within SplitTabComponent
            if (watch && tabAny.focusChanged$) {
                const sub = tabAny.focusChanged$.subscribe((focused: BaseTabComponent) => {
                    if (focused) {
                        this.checkAndSetActiveSession(focused)
                    }
                })
                this.subscriptions.push(sub)
            }

            const childTab = focusedTab || allTabs?.[0]
            if (childTab) {
                this.checkAndSetActiveSession(childTab, watch)
            } else {
                this.clipboardSync.clearActiveSession()
                // Child tabs not ready yet - wait for initialized$
                if (watch && tabAny.initialized$) {
                    const sub = tabAny.initialized$.subscribe(() => {
                        const child = tabAny.getFocusedTab?.() || tabAny.getAllTabs?.()?.[0]
                        if (child) {
                            this.checkAndSetActiveSession(child)
                        }
                    })
                    this.subscriptions.push(sub)
                }

                if (watch && tabAny.tabAdded$) {
                    const sub = tabAny.tabAdded$.subscribe((added: BaseTabComponent) => {
                        this.checkAndSetActiveSession(added)
                    })
                    this.subscriptions.push(sub)
                }
            }
            return
        }

        const isSSHTab = tabType.includes('SSH') ||
                         tabType.includes('Ssh') ||
                         tabAny.profile?.type === 'ssh'

        if (isSSHTab && tabAny.sshSession) {
            this.clipboardSync.setActiveSession(tabAny.sshSession, tabAny)
        } else if (isSSHTab && !tabAny.sshSession) {
            this.clipboardSync.clearActiveSession()
            if (watch) this.watchTabForSession(tab)
        } else {
            this.clipboardSync.clearActiveSession()
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe())
    }
}
