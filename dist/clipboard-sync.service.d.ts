import { Subject } from 'rxjs';
import { ConfigService, NotificationsService } from 'tabby-core';
interface SSHSession {
    profile: {
        options: {
            host: string;
            port: number;
            user: string;
        };
    };
}
export declare class ClipboardSyncService {
    private configService;
    private notifications;
    private activeContext;
    private config;
    readonly imagePasted$: Subject<{
        path: string;
    }>;
    readonly error$: Subject<{
        message: string;
    }>;
    constructor(configService: ConfigService, notifications: NotificationsService);
    /**
     * Set active SSH session for clipboard sync
     */
    setActiveSession(session: SSHSession, tab: any): void;
    clearActiveSession(): void;
    hasActiveSession(): boolean;
    /**
     * Handle Ctrl+Shift+V - paste image from clipboard
     * Returns true if handled (image or text pasted)
     */
    pasteImage(): Promise<boolean>;
    private sendImageToServer;
    private sendViaSFTP;
    private inputToTerminal;
    private writeToTerminal;
}
export {};
//# sourceMappingURL=clipboard-sync.service.d.ts.map