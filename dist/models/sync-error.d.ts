export declare enum SyncErrorType {
    SSH_DISCONNECTED = "ssh_disconnected",
    CHANNEL_FAILED = "channel_failed",
    COMMAND_FAILED = "command_failed",
    CLIPBOARD_ACCESS_DENIED = "clipboard_denied",
    DATA_TOO_LARGE = "data_too_large",
    CLIPBOARD_TOOL_NOT_FOUND = "clipboard_tool_not_found",
    ENCODING_FAILED = "encoding_failed",
    TIMEOUT = "timeout",
    REMOTE_OS_DETECTION_FAILED = "remote_os_detection_failed",
    UNKNOWN = "unknown"
}
export declare class SyncError extends Error {
    readonly type: SyncErrorType;
    readonly recoverable: boolean;
    constructor(type: SyncErrorType, message: string, recoverable?: boolean);
    static sshDisconnected(): SyncError;
    static channelFailed(reason: string): SyncError;
    static commandFailed(stderr: string): SyncError;
    static clipboardToolNotFound(os: string): SyncError;
    static dataTooLarge(size: number, maxSize: number): SyncError;
    static timeout(): SyncError;
}
//# sourceMappingURL=sync-error.d.ts.map