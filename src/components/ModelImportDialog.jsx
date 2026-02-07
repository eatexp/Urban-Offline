/**
 * ModelImportDialog - Import local .onnx model files
 *
 * Provides:
 * - File picker for .onnx model and optional tokenizer.json
 * - Task type selection dropdown
 * - Model name input
 * - Import progress bar
 * - File validation feedback
 */

import React, { useState, useRef } from 'react';
import {
    Upload, FileText, X, Check, AlertCircle,
    Loader2, ChevronDown
} from 'lucide-react';
import { ModelImporter, IMPORT_TASK_TYPES } from '../services/ai/ModelImporter';
import { createLogger } from '../utils/logger';

const log = createLogger('ModelImportDialog');

const ModelImportDialog = ({ isOpen, onClose, onImported }) => {
    const [modelFile, setModelFile] = useState(null);
    const [tokenizerFile, setTokenizerFile] = useState(null);
    const [modelName, setModelName] = useState('');
    const [taskType, setTaskType] = useState('text-generation');
    const [description, setDescription] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importMessage, setImportMessage] = useState('');
    const [error, setError] = useState(null);
    const [validationStatus, setValidationStatus] = useState(null); // null, 'valid', 'invalid'

    const modelInputRef = useRef(null);
    const tokenizerInputRef = useRef(null);

    const handleModelFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setModelFile(file);
        setError(null);
        setValidationStatus(null);

        // Auto-populate name from filename
        if (!modelName) {
            setModelName(file.name.replace(/\.onnx$/i, ''));
        }

        // Validate
        const isValid = await ModelImporter.validateOnnxFile(file);
        setValidationStatus(isValid ? 'valid' : 'invalid');

        if (!isValid) {
            setError('File does not appear to be a valid ONNX model');
        }
    };

    const handleTokenizerFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setError('Tokenizer must be a .json file');
            return;
        }

        setTokenizerFile(file);
        setError(null);
    };

    const handleImport = async () => {
        if (!modelFile || !modelName.trim()) return;

        setIsImporting(true);
        setError(null);

        try {
            const result = await ModelImporter.importModel(
                modelFile,
                tokenizerFile,
                {
                    name: modelName.trim(),
                    taskType,
                    description: description.trim()
                },
                (progress, message) => {
                    setImportProgress(progress);
                    setImportMessage(message);
                }
            );

            if (result.success) {
                log.info('Model imported', { modelId: result.modelId });
                if (onImported) onImported(result.metadata);
                handleReset();
                onClose();
            } else {
                setError(result.error);
            }
        } catch (err) {
            log.error('Import failed', err);
            setError(err.message);
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setModelFile(null);
        setTokenizerFile(null);
        setModelName('');
        setTaskType('text-generation');
        setDescription('');
        setImportProgress(0);
        setImportMessage('');
        setError(null);
        setValidationStatus(null);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isImporting ? onClose : undefined}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Upload size={20} className="text-blue-400" />
                        <h3 className="font-bold text-slate-100">Import Model</h3>
                    </div>
                    {!isImporting && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Model file picker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Model File (.onnx) *
                        </label>
                        <input
                            ref={modelInputRef}
                            type="file"
                            accept=".onnx"
                            onChange={handleModelFileSelect}
                            className="hidden"
                            disabled={isImporting}
                        />
                        <button
                            onClick={() => modelInputRef.current?.click()}
                            disabled={isImporting}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 hover:border-blue-400/50 hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
                        >
                            {modelFile ? (
                                <>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        validationStatus === 'valid' ? 'bg-green-500/20' :
                                        validationStatus === 'invalid' ? 'bg-red-500/20' : 'bg-blue-500/20'
                                    }`}>
                                        {validationStatus === 'valid' ? (
                                            <Check size={16} className="text-green-400" />
                                        ) : validationStatus === 'invalid' ? (
                                            <AlertCircle size={16} className="text-red-400" />
                                        ) : (
                                            <FileText size={16} className="text-blue-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-200 truncate">{modelFile.name}</p>
                                        <p className="text-xs text-slate-400">{formatSize(modelFile.size)}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Upload size={16} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400">Choose .onnx file</p>
                                        <p className="text-xs text-slate-500">Tap to browse files</p>
                                    </div>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Tokenizer file picker (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Tokenizer (optional)
                        </label>
                        <input
                            ref={tokenizerInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleTokenizerFileSelect}
                            className="hidden"
                            disabled={isImporting}
                        />
                        <button
                            onClick={() => tokenizerInputRef.current?.click()}
                            disabled={isImporting}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-left disabled:opacity-50"
                        >
                            {tokenizerFile ? (
                                <>
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                        <Check size={16} className="text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-200 truncate">{tokenizerFile.name}</p>
                                        <p className="text-xs text-slate-400">{formatSize(tokenizerFile.size)}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <FileText size={16} className="text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-500">tokenizer.json (optional)</p>
                                    </div>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Model name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Model Name *
                        </label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder="e.g., My Custom Model"
                            disabled={isImporting}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all disabled:opacity-50"
                        />
                    </div>

                    {/* Task type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Task Type
                        </label>
                        <div className="relative">
                            <select
                                value={taskType}
                                onChange={(e) => setTaskType(e.target.value)}
                                disabled={isImporting}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-blue-400/50 appearance-none disabled:opacity-50"
                            >
                                {IMPORT_TASK_TYPES.map(type => (
                                    <option key={type.id} value={type.id} className="bg-slate-800">
                                        {type.label} — {type.description}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Description (optional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this model"
                            disabled={isImporting}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all disabled:opacity-50"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2.5">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Import progress */}
                    {isImporting && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">{importMessage}</span>
                                <span className="text-slate-300 font-medium">{Math.round(importProgress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                                    style={{ width: `${importProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={isImporting}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all font-medium text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!modelFile || !modelName.trim() || validationStatus === 'invalid' || isImporting}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Import Model
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelImportDialog;
