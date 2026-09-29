/// <reference types="node" />
/// <reference types="node" />
export type PastePart = {
    text: string;
} | {
    source: string;
} | {
    png: Buffer;
};
export declare function htmlParts(html: string, base?: string): PastePart[];
export declare function readParts(clipboard: any): PastePart[];
export declare function imagePNG(source: string, nativeImage: any): Promise<Buffer>;
//# sourceMappingURL=clipboard-content.d.ts.map