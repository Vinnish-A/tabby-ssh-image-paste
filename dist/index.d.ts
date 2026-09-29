import { OnDestroy } from '@angular/core';
import { AppService, HotkeysService } from 'tabby-core';
import { ClipboardSyncService } from './clipboard-sync.service';
export default class ClipboardSyncModule implements OnDestroy {
    private clipboardSync;
    private app;
    private hotkeys;
    private subscriptions;
    constructor(clipboardSync: ClipboardSyncService, app: AppService, hotkeys: HotkeysService);
    private initializePasteHook;
    private initializeTabWatcher;
    private watchTabForSession;
    private checkAndSetActiveSession;
    ngOnDestroy(): void;
}
//# sourceMappingURL=index.d.ts.map