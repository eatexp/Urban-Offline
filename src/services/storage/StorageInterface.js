
// Interface Concept
export interface StorageProvider {
    init(): Promise<void>;
    getFile(path: string): Promise<Blob | null>;
    saveFile(path: string, blob: Blob): Promise<string>; // Returns path/url
    getMeta(table: string, id: string): Promise<any>;
    saveMeta(table: string, data: any): Promise<void>;
    search(query: string): Promise<any[]>;
}
