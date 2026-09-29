import { OnDestroy } from '@angular/core';
import { AppService } from 'tabby-core';
import { ClipboardSyncService } from './clipboard-sync.service';
export default class ClipboardSyncModule implements OnDestroy {
    private clipboardSync;
    private app;
    private subscriptions;
    constructor(clipboardSync: ClipboardSyncService, app: AppService);
    private initializeTabWatcher;
    private watchTabForSession;
    private checkAndSetActiveSession;
    ngOnDestroy(): void;
}
//# sourceMappingURL=index.d.ts.map