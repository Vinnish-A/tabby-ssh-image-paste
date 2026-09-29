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
    private pendingParts;
    private pasting;
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
    canPasteImage(): boolean;
    pasteImage(): Promise<boolean>;
    private sendViaSFTP;
    private writeToTerminal;
}
export {};
//# sourceMappingURL=clipboard-sync.service.d.ts.map