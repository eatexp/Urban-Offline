/**
 * Storage Provider Interface Concept
 * 
 * @typedef {Object} StorageProvider
 * @property {() => Promise<void>} init
 * @property {(path: string) => Promise<Blob | null>} getFile
 * @property {(path: string, blob: Blob) => Promise<string>} saveFile
 * @property {(table: string, id: string) => Promise<any>} getMeta
 * @property {(table: string, data: any) => Promise<void>} saveMeta
 * @property {(query: string) => Promise<any[]>} search
 */

export default {};
