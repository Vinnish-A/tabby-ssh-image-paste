/// <reference types="node" />
/// <reference types="node" />
export type ClipboardType = 'text' | 'image';
export interface ClipboardData {
    type: ClipboardType;
    format: string;
    data: Buffer;
    timestamp: number;
    hash: string;
}
export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}
export interface SyncResult {
    success: boolean;
    error?: Error;
    duration: number;
    dataSize: number;
}
export type RemoteOS = 'linux' | 'macos' | 'windows';
export type ClipboardTool = 'xclip' | 'xsel' | 'pbcopy' | 'clip.exe' | null;
export interface RemoteEnvironment {
    os: RemoteOS;
    tool: ClipboardTool;
}
//# sourceMappingURL=clipboard-data.interface.d.ts.map