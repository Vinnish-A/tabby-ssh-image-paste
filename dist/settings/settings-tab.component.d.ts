import { ConfigService } from 'tabby-core';
interface ClipboardSyncConfig {
    enabled: boolean;
    showNotifications: boolean;
}
export declare class ClipboardSyncSettingsTabComponent {
    private configService;
    config: ClipboardSyncConfig;
    constructor(configService: ConfigService);
    private getDefaultConfig;
    save(): void;
}
export {};
//# sourceMappingURL=settings-tab.component.d.ts.map