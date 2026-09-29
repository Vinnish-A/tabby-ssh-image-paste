/// <reference types="node" />
/// <reference types="node" />
interface Manifest {
    version: string;
    sha256: Record<string, string>;
}
export declare function newer(candidate: string, current: string): boolean;
export declare function applyUpdate(root: string, manifest: Manifest, fetchFile: (file: string) => Promise<Buffer>): Promise<boolean>;
export declare function checkForUpdate(notify: (message: string) => void): Promise<void>;
export {};
//# sourceMappingURL=update.d.ts.map