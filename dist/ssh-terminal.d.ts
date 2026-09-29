import { TranslateService } from 'tabby-core';
import { TerminalDecorator } from 'tabby-terminal';
import { ClipboardSyncService } from './clipboard-sync.service';
export declare class SSHTerminalDecorator extends TerminalDecorator {
    private clipboardSync;
    private translate;
    private restore;
    constructor(clipboardSync: ClipboardSyncService, translate: TranslateService);
    attach(tab: any): void;
    detach(tab: any): void;
}
//# sourceMappingURL=ssh-terminal.d.ts.map