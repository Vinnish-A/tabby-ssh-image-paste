import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { ClipboardSyncSettingsTabComponent } from './settings-tab.component'

@Injectable()
export class ClipboardSyncSettingsTabProvider extends SettingsTabProvider {
    id = 'clipboard-sync'
    icon = 'clipboard'
    title = 'SSH Image Paste'
    component = ClipboardSyncSettingsTabComponent

    getComponentType(): typeof ClipboardSyncSettingsTabComponent {
        return ClipboardSyncSettingsTabComponent
    }
}
