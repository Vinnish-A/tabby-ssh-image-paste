import { ConfigProvider } from 'tabby-core';
import { ClipboardSyncConfig } from '../models';
export declare class ClipboardSyncConfigProvider extends ConfigProvider {
    defaults: {
        clipboardSync: ClipboardSyncConfig;
    };
}
declare module 'tabby-core' {
    interface AppConfig {
        clipboardSync: ClipboardSyncConfig;
    }
}
//# sourceMappingURL=config.provider.d.ts.map