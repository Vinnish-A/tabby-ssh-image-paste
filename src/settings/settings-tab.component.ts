import { Component } from '@angular/core'
import { ConfigService } from 'tabby-core'

interface ClipboardSyncConfig {
    enabled: boolean
    showNotifications: boolean
}

@Component({
    selector: 'clipboard-sync-settings',
    template: `
        <div class="form-group">
            <h3>SSH Image Paste</h3>
            <small class="form-text text-muted">
                Use Tabby’s Paste shortcut (Ctrl+Shift+V on Windows) to upload a clipboard image
            </small>
        </div>

        <div class="form-group">
            <div class="form-check">
                <input
                    type="checkbox"
                    class="form-check-input"
                    id="enabled"
                    [(ngModel)]="config.enabled"
                    (ngModelChange)="save()"
                />
                <label class="form-check-label" for="enabled">
                    Enable clipboard sync
                </label>
            </div>
        </div>

        <div class="form-group">
            <div class="form-check">
                <input
                    type="checkbox"
                    class="form-check-input"
                    id="showNotifications"
                    [(ngModel)]="config.showNotifications"
                    (ngModelChange)="save()"
                />
                <label class="form-check-label" for="showNotifications">
                    Show notifications
                </label>
            </div>
        </div>
    `,
})
export class ClipboardSyncSettingsTabComponent {
    config: ClipboardSyncConfig

    constructor(private configService: ConfigService) {
        this.config = this.configService.store.clipboardSync || this.getDefaultConfig()
    }

    private getDefaultConfig(): ClipboardSyncConfig {
        return {
            enabled: true,
            showNotifications: true,
        }
    }

    save(): void {
        if (!this.configService.store.clipboardSync) {
            (this.configService.store as Record<string, unknown>).clipboardSync = this.getDefaultConfig()
        }
        Object.assign(this.configService.store.clipboardSync, this.config)
        this.configService.save()
    }
}
