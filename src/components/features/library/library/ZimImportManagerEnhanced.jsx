/**
 * ZimImportManagerEnhanced — Unified ZIM Import with Cartridge Metaphor
 *
 * Integrates ZIM imports into the Library page using the cartridge visual language.
 * Replaces the separate ZimImportManager with a unified "cartridge dock" approach.
 *
 * Features:
 * - Drag-and-drop ZIM import with cartridge-style upload slot
 * - Installed ZIMs displayed as cartridges (consistent with datasets)
 * - Real-time import progress visualization
 * - Unified with DatasetManager visual language
 *
 * Compliance: .clinerules §4 - Content pack consistency
 *             .clinerules §6 - 48px touch targets
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileArchive, AlertCircle, X } from 'lucide-react';
import ZimImportCartridge, { ZimUploadSlot } from './ZimImportCartridge';
import { ContentPackManager } from '../../services/contentPacks/ContentPackManager';
import '../Cartridge.css';

/**
 * ZimImportManagerEnhanced Component
 *
 * @param {Object} props
 * @param {Function} props.onImportsChange - Callback when imports change
 */
const ZimImportManagerEnhanced = ({ onImportsChange }) => {
    const [zimImports, setZimImports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importMessage, setImportMessage] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Load existing ZIM imports
    const loadImports = useCallback(async () => {
        try {
            setLoading(true);
            const imports = await ContentPackManager.getZimImports();
            setZimImports(imports);
            onImportsChange?.(imports);
        } catch (err) {
            console.error('Failed to load ZIM imports:', err);
            setError('Failed to load ZIM imports');
        } finally {
            setLoading(false);
        }
    }, [onImportsChange]);

    useEffect(() => {
        loadImports();
    }, [loadImports]);

    // Handle drag events
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const zimFile = files.find(f => f.name.endsWith('.zim'));

        if (zimFile) {
            handleImport(zimFile);
        } else {
            setError('Please drop a .zim file');
            setTimeout(() => setError(null), 3000);
        }
    }, [handleImport]);

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImport(file);
        }
    };

    // Import ZIM file
    const handleImport = useCallback(async (file) => {
        setIsImporting(true);
        setImportProgress(0);
        setImportMessage('Starting...');
        setError(null);

        try {
            const result = await ContentPackManager.importZimFile(file, (percent, message) => {
                setImportProgress(percent);
                setImportMessage(message);
            });

            if (result.success) {
                await loadImports();
            } else {
                setError(result.error || 'Import failed');
            }
        } catch (err) {
            setError(err.message || 'Import failed');
        } finally {
            setIsImporting(false);
        }
    }, [loadImports]);

    // Uninstall ZIM import
    const handleUninstall = async (packId) => {
        try {
            const result = await ContentPackManager.uninstallZimImport(packId);
            if (result.success) {
                await loadImports();
            } else {
                setError(result.error || 'Failed to remove import');
            }
        } catch (err) {
            setError(err.message || 'Failed to remove import');
        }
    };

    // Open file picker
    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    if (loading) {
        return (
            <div className="cartridge-grid">
                <div className="cartridge cartridge--idle">
                    <div className="cartridge__body">
                        <div className="cartridge__icon-wrapper">
                            <FileArchive className="cartridge__icon" size={28} />
                        </div>
                        <h3 className="cartridge__title">Loading...</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="zim-import-enhanced">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".zim"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Error toast */}
            {error && (
                <div className="cartridge-error-toast" role="alert">
                    <AlertCircle size={16} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '4px',
                            minWidth: '44px',
                            minHeight: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Cartridge grid */}
            <div className="cartridge-grid">
                {/* Upload slot (always first) */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <ZimUploadSlot
                        isDragging={isDragging}
                        isImporting={isImporting}
                        importProgress={importProgress}
                        importMessage={importMessage}
                        onClick={openFilePicker}
                    />
                </div>

                {/* Installed ZIM imports */}
                {zimImports.map((zim) => (
                    <ZimImportCartridge
                        key={zim.id}
                        zim={zim}
                        onUninstall={handleUninstall}
                        isImporting={false}
                    />
                ))}
            </div>

            {/* Empty state hint */}
            {zimImports.length === 0 && !isImporting && (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-6)',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)'
                }}>
                    <p>No ZIM archives imported yet.</p>
                    <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                        Download ZIM files from <a href="https://library.kiwix.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)' }}>library.kiwix.org</a>
                    </p>
                </div>
            )}
        </div>
    );
};

export default ZimImportManagerEnhanced;