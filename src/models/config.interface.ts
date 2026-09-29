export interface ClipboardSyncConfig {
    autoUpdate: boolean
    enabled: boolean
    showNotifications: boolean
}

export const DEFAULT_CONFIG: ClipboardSyncConfig = {
    autoUpdate: true,
    enabled: true,
    showNotifications: true,
}
