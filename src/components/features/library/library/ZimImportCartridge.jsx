/**
 * ZimImportCartridge — ZIM Import as Cartridge Component
 *
 * Unifies ZIM import UI with the cartridge metaphor used by DatasetManager.
 * Provides consistent visual language: connector pins, status dots, color coding.
 *
 * Visual hierarchy:
 *   - Idle: Glassmorphism, subtle border
 *   - Importing: Pulsing border with progress ring
 *   - Installed: Bright accent border, "MOUNTED" status
 *
 * Compliance: .clinerules §4 - Content pack consistency
 *             .clinerules §6 - 48px touch targets
 */

import { useRef, useCallback, useState } from 'react';
import { Upload, Trash2, Loader, FileArchive, Check, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import '../Cartridge.css';

// ZIM imports use a distinct purple/cyan color scheme
const ZIM_ACCENT = {
    border: '#a855f7',
    glow: '#06b6d4',
    label: 'ZIM IMPORT',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
};

/**
 * ZIM Import Cartridge Component
 *
 * @param {Object} props
 * @param {Object} props.zim - ZIM import metadata
 * @param {Function} props.onUninstall - Callback to remove import
 * @param {boolean} props.isImporting - Whether currently importing
 * @param {number} props.importProgress - Import progress 0-100
 * @param {string} props.importMessage - Current import status message
 */
const ZimImportCartridge = ({
    zim,
    onUninstall,
    isImporting = false,
    importProgress = 0,
    importMessage = ''
}) => {
    const cartridgeRef = useRef(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const isInstalled = !!zim.installedAt && !isImporting;

    // Determine visual state
    let stateClass = 'cartridge--idle';
    if (isImporting) {
        stateClass = 'cartridge--processing';
    } else if (isInstalled) {
        stateClass = 'cartridge--mounted';
    }

    // Snap animation for physicality
    const playSnap = useCallback(() => {
        const el = cartridgeRef.current;
        if (!el) return;
        el.classList.remove('cartridge--snapping');
        void el.offsetWidth; // Force reflow
        el.classList.add('cartridge--snapping');
    }, []);

    // EJECT handler
    const handleEject = useCallback(async () => {
        if (showConfirm) {
            await triggerHaptic('heavy');
            playSnap();
            onUninstall(zim.id);
            setShowConfirm(false);
        } else {
            await triggerHaptic('medium');
            setShowConfirm(true);
        }
    }, [showConfirm, onUninstall, zim.id, playSnap]);

    const handleCancel = useCallback(() => {
        setShowConfirm(false);
    }, []);

    // Format article count with commas
    const formatCount = (n) => n?.toLocaleString() || '0';

    return (
        <div
            ref={cartridgeRef}
            className={`cartridge ${stateClass}`}
            style={{
                '--accent-color': ZIM_ACCENT.border,
                '--glow-color': ZIM_ACCENT.glow,
            }}
            role="article"
            aria-label={`${zim.name} ZIM import — ${isInstalled ? 'mounted' : isImporting ? 'importing' : 'available'}`}
        >
            {/* Top edge — connector pins */}
            <div className="cartridge__connector" aria-hidden="true">
                <div className="cartridge__pins">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="cartridge__pin" />
                    ))}
                </div>
            </div>

            {/* Main body */}
            <div className="cartridge__body">
                {/* Status indicator */}
                <div
                    className={`cartridge__status-dot ${isInstalled ? 'cartridge__status-dot--active' : ''} ${isImporting ? 'cartridge__status-dot--refining' : ''}`}
                    aria-hidden="true"
                />

                {/* Type label */}
                <div className="cartridge__type-label" style={{ color: ZIM_ACCENT.border }}>
                    {ZIM_ACCENT.label}
                </div>

                {/* Icon */}
                <div className="cartridge__icon-wrapper" aria-hidden="true">
                    <FileArchive className="cartridge__icon" size={28} strokeWidth={1.5} />
                    {isImporting && (
                        <div className="cartridge__refinery-ring" />
                    )}
                </div>

                {/* Title & description */}
                <h3 className="cartridge__title">{zim.name}</h3>
                <p className="cartridge__description">
                    {zim.description || `Imported ZIM archive with ${formatCount(zim.articleCount)} articles`}
                </p>

                {/* Meta bar */}
                <div className="cartridge__meta">
                    <span className="cartridge__size">
                        <FileArchive size={12} strokeWidth={2} aria-hidden="true" />
                        {zim.sizeDisplay || zim.size}
                    </span>
                    {isInstalled && (
                        <span className="cartridge__status-badge">
                            <Check size={12} strokeWidth={2} aria-hidden="true" />
                            MOUNTED
                        </span>
                    )}
                </div>

                {/* Article count badge */}
                {zim.articleCount > 0 && (
                    <div className="cartridge__article-count">
                        {formatCount(zim.articleCount)} articles
                    </div>
                )}

                {/* Import progress */}
                {isImporting && (
                    <div className="cartridge__progress">
                        <div className="cartridge__progress-bar">
                            <div
                                className="cartridge__progress-fill"
                                style={{ width: `${importProgress}%` }}
                            />
                        </div>
                        <span className="cartridge__progress-text">
                            {importMessage} ({Math.round(importProgress)}%)
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="cartridge__actions">
                    {showConfirm ? (
                        <div className="cartridge__confirm">
                            <button
                                onClick={handleEject}
                                className="cartridge__btn cartridge__btn--confirm"
                                aria-label={`Confirm remove ${zim.name}`}
                            >
                                <span>Confirm</span>
                            </button>
                            <button
                                onClick={handleCancel}
                                className="cartridge__btn cartridge__btn--cancel"
                                aria-label="Cancel removal"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : isInstalled ? (
                        <button
                            onClick={handleEject}
                            className="cartridge__btn cartridge__btn--eject"
                            aria-label={`Remove ${zim.name} import`}
                        >
                            <Trash2 size={14} aria-hidden="true" />
                            <span>REMOVE</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Processing pulse overlay */}
            {isImporting && (
                <div className="cartridge__pulse-overlay" aria-hidden="true" />
            )}
        </div>
    );
};

/**
 * Upload Slot Component — Drop zone for new ZIM imports
 *
 * @param {Object} props
 * @param {boolean} props.isDragging - Whether drag is active
 * @param {boolean} props.isImporting - Whether currently importing
 * @param {number} props.importProgress - Import progress
 * @param {string} props.importMessage - Status message
 * @param {Function} props.onClick - Click handler to open file picker
 */
export const ZimUploadSlot = ({
    isDragging = false,
    isImporting = false,
    importProgress = 0,
    importMessage = '',
    onClick
}) => {
    return (
        <div
            className={`cartridge cartridge--upload-slot ${isDragging ? 'cartridge--dragging' : ''} ${isImporting ? 'cartridge--processing' : ''}`}
            onClick={!isImporting ? onClick : undefined}
            style={{
                '--accent-color': ZIM_ACCENT.border,
                '--glow-color': ZIM_ACCENT.glow,
            }}
            role="button"
            aria-label="Upload ZIM file"
        >
            {/* Connector pins */}
            <div className="cartridge__connector" aria-hidden="true">
                <div className="cartridge__pins">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="cartridge__pin cartridge__pin--dim" />
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="cartridge__body">
                <div className="cartridge__icon-wrapper" style={{ background: ZIM_ACCENT.bgGradient }}>
                    {isImporting ? (
                        <Loader className="cartridge__spin" size={28} />
                    ) : (
                        <Upload size={28} strokeWidth={1.5} style={{ color: ZIM_ACCENT.border }} />
                    )}
                </div>

                <h3 className="cartridge__title">
                    {isImporting ? 'Importing...' : 'Import ZIM Archive'}
                </h3>

                <p className="cartridge__description">
                    {isImporting
                        ? importMessage
                        : 'Drop a .zim file here or click to browse. Supports Wikipedia, StackOverflow, TED Talks, and more.'}
                </p>

                {/* Progress */}
                {isImporting && (
                    <div className="cartridge__progress">
                        <div className="cartridge__progress-bar">
                            <div
                                className="cartridge__progress-fill"
                                style={{
                                    width: `${importProgress}%`,
                                    background: ZIM_ACCENT.bgGradient
                                }}
                            />
                        </div>
                        <span className="cartridge__progress-text">
                            {Math.round(importProgress)}%
                        </span>
                    </div>
                )}

                {/* Hint */}
                {!isImporting && (
                    <div className="cartridge__hint">
                        <span style={{ color: ZIM_ACCENT.border }}>
                            Download from library.kiwix.org
                        </span>
                    </div>
                )}
            </div>

            {/* Drag overlay */}
            {isDragging && (
                <div className="cartridge__drag-overlay" aria-hidden="true">
                    <Upload size={48} style={{ color: ZIM_ACCENT.border }} />
                    <span>Drop ZIM file here</span>
                </div>
            )}
        </div>
    );
};

export default ZimImportCartridge;