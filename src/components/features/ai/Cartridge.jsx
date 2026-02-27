/**
 * Cartridge.jsx — Data Cartridge Component (The Patchbay)
 *
 * Visual metaphor: A physical data drive — NES cartridge meets Cyberpunk.
 * Represents a dataset/region that can be "mounted" into the AI brain.
 *
 * States:
 *   - Idle:       Dim, glassmorphism, low-opacity border
 *   - Mounted:    Bright accent border, inner glow — memory locked in
 *   - Processing: Border pulses — the Refinery is distilling data
 *
 * Refinery Standard:
 *   - Touch targets: 48px minimum (--button-height-lg)
 *   - Haptics: medium on LOAD, heavy on EJECT
 *   - Accessible: aria-labels on all interactive elements
 */

import { useRef, useCallback } from 'react';
import { Download, Trash2, Loader, Database, Cpu, Zap, Shield, Map, BookOpen } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import './Cartridge.css';

// Map dataset type/modules to an icon component
const CartridgeIcon = ({ dataset, ...props }) => {
    const modules = dataset.modules || [];
    if (modules.includes('map-tiles')) return <Map {...props} />;
    if (modules.includes('wiki')) return <BookOpen {...props} />;
    if (dataset.type === 'guide') return <Shield {...props} />;
    if (dataset.type === 'medical') return <Zap {...props} />;
    return <Database {...props} />;
};

// Map dataset type to a color accent
const getAccentColor = (dataset) => {
    const type = dataset.type || 'default';
    switch (type) {
        case 'guide': return { border: '#06b6d4', glow: '#06b6d4', label: 'GUIDE' };
        case 'city': return { border: '#a855f7', glow: '#a855f7', label: 'REGION' };
        case 'medical': return { border: '#ef4444', glow: '#ef4444', label: 'MEDICAL' };
        case 'legal': return { border: '#f59e0b', glow: '#f59e0b', label: 'LEGAL' };
        default: return { border: '#06b6d4', glow: '#06b6d4', label: 'DATA' };
    }
};

const Cartridge = ({ dataset, onInstall, onUninstall, processing, isRefining = false }) => {
    const cartridgeRef = useRef(null);

    const accent = getAccentColor(dataset);
    const isInstalled = dataset.isInstalled;
    const isProcessingThis = processing === dataset.id;

    // Determine visual state
    let stateClass = 'cartridge--idle';
    if (isRefining) {
        stateClass = 'cartridge--processing';
    } else if (isInstalled) {
        stateClass = 'cartridge--mounted';
    }

    // Snap animation — plays on mount/eject for physicality
    const playSnap = useCallback(() => {
        const el = cartridgeRef.current;
        if (!el) return;
        el.classList.remove('cartridge--snapping');
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('cartridge--snapping');
    }, []);

    // LOAD handler — medium haptic + snap
    const handleLoad = useCallback(async () => {
        await triggerHaptic('medium');
        playSnap();
        onInstall(dataset.id);
    }, [dataset.id, onInstall, playSnap]);

    // EJECT handler — heavy haptic + snap
    const handleEject = useCallback(async () => {
        await triggerHaptic('heavy');
        playSnap();
        onUninstall(dataset.id);
    }, [dataset.id, onUninstall, playSnap]);

    return (
        <div
            ref={cartridgeRef}
            className={`cartridge ${stateClass}`}
            style={{
                '--accent-color': accent.border,
                '--glow-color': accent.glow,
            }}
            role="article"
            aria-label={`${dataset.name} data cartridge — ${isInstalled ? 'mounted' : 'available'}`}
        >
            {/* Top edge — the "connector pins" */}
            <div className="cartridge__connector" aria-hidden="true">
                <div className="cartridge__pins">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="cartridge__pin" />
                    ))}
                </div>
            </div>

            {/* Main body */}
            <div className="cartridge__body">
                {/* Status indicator dot */}
                <div
                    className={`cartridge__status-dot ${isInstalled ? 'cartridge__status-dot--active' : ''} ${isRefining ? 'cartridge__status-dot--refining' : ''}`}
                    aria-hidden="true"
                />

                {/* Type label */}
                <div className="cartridge__type-label" style={{ color: accent.border }}>
                    {accent.label}
                </div>

                {/* Icon */}
                <div className="cartridge__icon-wrapper" aria-hidden="true">
                    <CartridgeIcon dataset={dataset} className="cartridge__icon" size={28} strokeWidth={1.5} />
                    {isRefining && (
                        <div className="cartridge__refinery-ring" />
                    )}
                </div>

                {/* Title & description */}
                <h3 className="cartridge__title">{dataset.name}</h3>
                <p className="cartridge__description">{dataset.description}</p>

                {/* Meta bar */}
                <div className="cartridge__meta">
                    <span className="cartridge__size">
                        <Database size={12} strokeWidth={2} aria-hidden="true" />
                        {typeof dataset.size === 'number' ? `${dataset.size} MB` : dataset.size}
                    </span>
                    {isInstalled && (
                        <span className="cartridge__status-badge">
                            <Cpu size={12} strokeWidth={2} aria-hidden="true" />
                            MOUNTED
                        </span>
                    )}
                </div>

                {/* Action button */}
                <div className="cartridge__actions">
                    {isInstalled ? (
                        <button
                            onClick={handleEject}
                            disabled={isProcessingThis}
                            className="cartridge__btn cartridge__btn--eject"
                            aria-label={`Eject ${dataset.name} cartridge`}
                        >
                            {isProcessingThis ? (
                                <Loader className="cartridge__spin" size={16} aria-hidden="true" />
                            ) : (
                                <>
                                    <Trash2 size={14} aria-hidden="true" />
                                    <span>EJECT</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleLoad}
                            disabled={isProcessingThis}
                            className="cartridge__btn cartridge__btn--load"
                            aria-label={`Load ${dataset.name} cartridge`}
                        >
                            {isProcessingThis ? (
                                <Loader className="cartridge__spin" size={16} aria-hidden="true" />
                            ) : (
                                <>
                                    <Download size={14} aria-hidden="true" />
                                    <span>LOAD</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Refinery pulse overlay */}
            {isRefining && (
                <div className="cartridge__pulse-overlay" aria-hidden="true" />
            )}
        </div>
    );
};

export default Cartridge;
