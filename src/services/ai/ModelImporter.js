/**
 * ModelImporter - Import local .onnx model files
 *
 * Handles:
 * - File selection via browser file picker
 * - ONNX magic byte validation
 * - Storing imported models in IndexedDB alongside HuggingFace models
 * - User-assigned task type (text-generation, embeddings, etc.)
 *
 * Imported models are flagged with source: 'local' in metadata
 */

import { db } from '../db';
import { createLogger } from '../../utils/logger';

const log = createLogger('ModelImporter');

// ONNX magic bytes: \x08 followed by protobuf
// ONNX files start with a protobuf-encoded ModelProto
const ONNX_MAGIC_BYTES = [0x08]; // First byte of protobuf varint for ir_version field

// Supported task types for imported models
export const IMPORT_TASK_TYPES = [
    { id: 'text-generation', label: 'Text Generation', description: 'Chat and text completion' },
    { id: 'feature-extraction', label: 'Embeddings', description: 'Semantic search embeddings' },
    { id: 'text-classification', label: 'Text Classification', description: 'Intent and sentiment analysis' },
    { id: 'question-answering', label: 'Question Answering', description: 'Extractive QA from context' },
    { id: 'summarization', label: 'Summarization', description: 'Text summarization' }
];

// Store name for model metadata
const MODELS_STORE = 'ai_models';

/**
 * Model Importer Service
 */
export const ModelImporter = {
    /**
     * Import a local .onnx model file
     *
     * @param {File} modelFile - The .onnx file
     * @param {File|null} tokenizerFile - Optional tokenizer.json file
     * @param {Object} metadata - User-provided metadata
     * @param {string} metadata.name - Display name for the model
     * @param {string} metadata.taskType - Task type from IMPORT_TASK_TYPES
     * @param {string} metadata.description - Optional description
     * @param {Function} onProgress - Progress callback (0-100)
     * @returns {Promise<{ success: boolean, modelId?: string, error?: string }>}
     */
    async importModel(modelFile, tokenizerFile, metadata, onProgress) {
        try {
            log.info('Starting model import', {
                fileName: modelFile.name,
                fileSize: modelFile.size,
                taskType: metadata.taskType
            });

            if (onProgress) onProgress(0, 'Validating file...');

            // Step 1: Validate ONNX file
            const isValid = await this.validateOnnxFile(modelFile);
            if (!isValid) {
                return { success: false, error: 'Invalid ONNX file. Please select a valid .onnx model file.' };
            }

            if (onProgress) onProgress(10, 'Reading model file...');

            // Step 2: Read model file as ArrayBuffer
            const modelBuffer = await this._readFileAsArrayBuffer(modelFile, (progress) => {
                if (onProgress) onProgress(10 + (progress * 0.6), 'Reading model file...');
            });

            // Step 3: Read tokenizer if provided
            let tokenizerData = null;
            if (tokenizerFile) {
                if (onProgress) onProgress(70, 'Reading tokenizer...');
                const tokenizerText = await tokenizerFile.text();
                try {
                    tokenizerData = JSON.parse(tokenizerText);
                } catch (_e) {
                    return { success: false, error: 'Invalid tokenizer.json file. Must be valid JSON.' };
                }
            }

            if (onProgress) onProgress(80, 'Storing model...');

            // Step 4: Generate model ID
            const modelId = `local-${Date.now()}-${modelFile.name.replace(/\.onnx$/i, '').replace(/[^a-zA-Z0-9]/g, '-')}`;

            // Step 5: Store model data in IndexedDB
            await this._storeModelData(modelId, modelBuffer, tokenizerData);

            if (onProgress) onProgress(90, 'Saving metadata...');

            // Step 6: Save model metadata
            const modelMetadata = {
                id: modelId,
                name: metadata.name || modelFile.name.replace(/\.onnx$/i, ''),
                description: metadata.description || `Imported from ${modelFile.name}`,
                size: modelFile.size,
                sizeDisplay: this._formatSize(modelFile.size),
                task: metadata.taskType || 'text-generation',
                source: 'local',
                originalFileName: modelFile.name,
                hasTokenizer: !!tokenizerData,
                installedAt: new Date().toISOString(),
                version: '1.0.0',
                tier: 'local', // Local imports bypass tier system
                legacy: false
            };

            await db.put(MODELS_STORE, modelMetadata);

            if (onProgress) onProgress(100, 'Import complete!');

            log.info('Model imported successfully', { modelId, name: modelMetadata.name });
            return { success: true, modelId, metadata: modelMetadata };

        } catch (error) {
            log.error('Model import failed', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Validate that a file is a valid ONNX model
     * Checks magic bytes and file extension
     *
     * @param {File} file - File to validate
     * @returns {Promise<boolean>}
     */
    async validateOnnxFile(file) {
        // Check file extension
        if (!file.name.toLowerCase().endsWith('.onnx')) {
            log.warn('File does not have .onnx extension', { name: file.name });
            return false;
        }

        // Check file size (minimum reasonable size for an ONNX model)
        if (file.size < 1024) { // Less than 1KB
            log.warn('File too small to be a valid ONNX model', { size: file.size });
            return false;
        }

        // Check magic bytes
        try {
            const header = await this._readFileHeader(file, 16);
            const bytes = new Uint8Array(header);

            // ONNX protobuf starts with field 1 (ir_version) as varint
            // First byte should be 0x08 (field 1, wire type 0)
            if (bytes[0] === ONNX_MAGIC_BYTES[0]) {
                return true;
            }

            // Some ONNX files may have different starting bytes depending on version
            // Also accept if the file passes extension check and is > 1MB
            if (file.size > 1024 * 1024) {
                log.info('Large .onnx file accepted despite non-standard header');
                return true;
            }

            log.warn('ONNX magic byte check failed', { firstByte: bytes[0] });
            return false;
        } catch (error) {
            log.error('Failed to validate ONNX file', error);
            return false;
        }
    },

    /**
     * Delete an imported model
     * @param {string} modelId - Model ID to delete
     */
    async deleteImportedModel(modelId) {
        try {
            // Delete metadata
            await db.delete(MODELS_STORE, modelId);

            // Delete stored model data
            await this._deleteModelData(modelId);

            log.info('Imported model deleted', { modelId });
            return { success: true };
        } catch (error) {
            log.error('Failed to delete imported model', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all imported models
     * @returns {Promise<Array>}
     */
    async getImportedModels() {
        try {
            const allModels = await db.getAll(MODELS_STORE);
            return (allModels || []).filter(m => m.source === 'local');
        } catch (_error) {
            return [];
        }
    },

    /**
     * Read file header bytes
     * @private
     */
    async _readFileHeader(file, bytes) {
        const slice = file.slice(0, bytes);
        return slice.arrayBuffer();
    },

    /**
     * Read file as ArrayBuffer with progress
     * @private
     */
    _readFileAsArrayBuffer(file, onProgress) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress(event.loaded / event.total);
                }
            };

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Store model data in IndexedDB
     * @private
     */
    async _storeModelData(modelId, modelBuffer, tokenizerData) {
        // Store in a dedicated IndexedDB for imported models
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('urban-offline-imported-models', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('models')) {
                    db.createObjectStore('models', { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                const idb = event.target.result;
                const tx = idb.transaction(['models'], 'readwrite');
                const store = tx.objectStore('models');

                store.put({
                    id: modelId,
                    modelData: modelBuffer,
                    tokenizerData: tokenizerData,
                    storedAt: new Date().toISOString()
                });

                tx.oncomplete = () => {
                    idb.close();
                    resolve();
                };

                tx.onerror = () => {
                    idb.close();
                    reject(tx.error);
                };
            };

            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Delete model data from IndexedDB
     * @private
     */
    async _deleteModelData(modelId) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('urban-offline-imported-models', 1);

            request.onsuccess = (event) => {
                const idb = event.target.result;

                if (!idb.objectStoreNames.contains('models')) {
                    idb.close();
                    resolve();
                    return;
                }

                const tx = idb.transaction(['models'], 'readwrite');
                const store = tx.objectStore('models');
                store.delete(modelId);

                tx.oncomplete = () => {
                    idb.close();
                    resolve();
                };

                tx.onerror = () => {
                    idb.close();
                    reject(tx.error);
                };
            };

            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Format file size
     * @private
     */
    _formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
};

export default ModelImporter;
