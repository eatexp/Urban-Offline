import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PMTiles, Protocol } from 'pmtiles';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Satellite, Download, Radio, Navigation2, Plus, Minus } from 'lucide-react';
import ContextManager from '../../services/context/ContextManager';
import { resolveSectorCached, resolveCartridgeForSector } from '../../services/maps/SectorResolver';
import { CapacitorPMTilesSource } from '../../services/maps/CapacitorPMTilesSource';
import { MAP_CONFIG, getMapStyle } from '../../services/maps/MapService';
import { HapticsService, ImpactStyle } from '../../services/HapticsService';

// Constants
const LOCAL_FILENAME = 'london.pmtiles';
const REMOTE_DEMO_URL = 'https://protomaps.github.io/PMTiles/protomaps(vector)ODbL_firenze.pmtiles';

// Haptic helper
const triggerHaptic = (type) => {
    if (type === 'light') HapticsService.impact(ImpactStyle.Light);
    else if (type === 'medium') HapticsService.impact(ImpactStyle.Medium);
    else if (type === 'success') HapticsService.notification('SUCCESS');
};

const OfflineMap = () => {
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const [mapState, setMapState] = useState('initializing'); // initializing, ready, error, missing, downloading, mounting
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [userLocation, setUserLocation] = useState(null);
    const location = useLocation(); // React Router location for passing state

    const initMap = useCallback(async () => {
        if (mapInstance.current) return;

        try {
            const maplibregl = (await import('maplibre-gl')).default;

            // 1. Check for Local Cartridge
            let isLocal = false;
            let localUri = '';

            if (Capacitor.isNativePlatform()) {
                try {
                    const stat = await Filesystem.stat({
                        path: LOCAL_FILENAME,
                        directory: Directory.Data
                    });
                    isLocal = true;
                    localUri = stat.uri;
                    console.log('Mounting Local Cartridge:', localUri);
                } catch (_e) {
                    // For demo flow, forcing clear "Missing" state if not found
                    setMapState('missing');
                    return;
                }
            }

            // 2. Configure Protocol
            let protocol;
            if (isLocal) {
                const source = new CapacitorPMTilesSource(localUri);
                // We add a random ID to the source key to prevent caching issues on re-mounts
                const pmtiles = new PMTiles(source);
                protocol = new Protocol(pmtiles);
            } else {
                protocol = new Protocol();
            }

            // Remove existing protocol if any (maplibre limitation: addProtocol is global)
            // In a real app we'd check if registered. Here we might get a warning, which is fine.
            try {
                maplibregl.removeProtocol("pmtiles");
            } catch (_e) {/* ignore */ }

            maplibregl.addProtocol("pmtiles", protocol.tile);

            // 3. Style URL
            const mapSourceUrl = isLocal ? 'pmtiles://stub' : `pmtiles://${REMOTE_DEMO_URL}`;

            // Create Map
            const map = new maplibregl.Map({
                container: mapContainer.current,
                style: getMapStyle(mapSourceUrl),
                center: MAP_CONFIG.defaultCenter,
                zoom: MAP_CONFIG.defaultZoom,
                minZoom: MAP_CONFIG.minZoom,
                maxZoom: MAP_CONFIG.maxZoom,
                attributionControl: false,
                fadeDuration: 0
            });

            mapInstance.current = map;

            map.on('load', () => {
                setMapState('ready'); // Glitch transition handled in UI component

                // Initial Context Sync
                const center = map.getCenter();
                const centerArray = [center.lng, center.lat];
                const resolvedSector = resolveSectorCached(centerArray);
                const resolvedCartridge = resolveCartridgeForSector(centerArray);

                ContextManager.getInstance().updateMapState({
                    center: centerArray,
                    zoom: map.getZoom(),
                    activeSector: resolvedSector
                });

                ContextManager.getInstance().updateActiveCartridge(resolvedCartridge);

                // Add Tactical Overlays
                const pins = {
                    type: 'FeatureCollection',
                    features: [
                        { type: 'Feature', geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] }, properties: { title: 'Triage Center Alpha', type: 'medical' } },
                    ]
                };

                if (!map.getSource('safety-pins')) {
                    map.addSource('safety-pins', { type: 'geojson', data: pins });
                    map.addLayer({
                        id: 'safety-pins-layer',
                        type: 'circle',
                        source: 'safety-pins',
                        paint: {
                            'circle-radius': 6,
                            'circle-color': '#06b6d4', // Cyan 500
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#0f172a', // Slate 900
                            'circle-opacity': 0.8
                        }
                    });
                }
            });

            // Track movement for AI Context
            map.on('moveend', () => {
                const center = map.getCenter();
                const centerArray = [center.lng, center.lat];
                const resolvedSector = resolveSectorCached(centerArray);
                const resolvedCartridge = resolveCartridgeForSector(centerArray);

                ContextManager.getInstance().updateMapState({
                    center: centerArray,
                    zoom: map.getZoom(),
                    activeSector: resolvedSector
                });

                ContextManager.getInstance().updateActiveCartridge(resolvedCartridge);
            });

            map.on('error', (e) => {
                // Handle missing source
                if (e.error && (e.error.status === 404 || e.error.message?.includes('fetch'))) {
                    if (mapState !== 'ready') setMapState('missing');
                }
            });

        } catch (error) {
            console.error("Failed to initialize map:", error);
            setMapState('error');
        }
    }, [mapState]);

    useEffect(() => {
        if (mapContainer.current && mapState === 'initializing') {
            initMap();
        }
    }, [mapState, initMap]);

    // Handle Incoming Navigation (Target Lock)
    useEffect(() => {
        if (mapState === 'ready' && mapInstance.current && location.state?.flyTo) {
            const { center, zoom, pitch } = location.state.flyTo;
            console.log('Executing Target Lock:', center);

            // Short delay to ensure view is settled
            setTimeout(() => {
                triggerHaptic('success');
                mapInstance.current.flyTo({
                    center: center,
                    zoom: zoom || 14,
                    pitch: pitch || 0,
                    essential: true,
                    speed: 1.5,
                    curve: 1.2
                });
            }, 500);
        }
    }, [mapState, location.state]);

    // Satellite Link Sequence
    const handleDownload = async () => {
        setMapState('downloading');
        setDownloadProgress(0);
        triggerHaptic('medium');

        try {
            // Step 1: Simulated Download
            // 2 Seconds Total
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                await new Promise(r => setTimeout(r, 100)); // 100ms * 20 = 2000ms
                setDownloadProgress(i * (100 / steps));
            }

            // Step 2: Write Dummy File (Native Only)
            if (Capacitor.isNativePlatform()) {
                await Filesystem.writeFile({
                    path: LOCAL_FILENAME,
                    data: 'placeholder',
                    directory: Directory.Data,
                    encoding: 'utf8'
                });
            }

            // Step 3: Trigger Glitch / Mounting
            setMapState('mounting');
            triggerHaptic('success');

            // Wait for glitch animation (500ms) then init
            setTimeout(() => {
                setMapState('initializing');
                // initMap will trigger via useEffect when state changes to initializing
            }, 800);

        } catch (_e) {
            console.error('Download failed', _e);
            setMapState('error');
        }
    };

    const handleZoom = (delta) => {
        triggerHaptic('light');
        if (mapInstance.current) delta > 0 ? mapInstance.current.zoomIn() : mapInstance.current.zoomOut();
    };

    const handleLocate = () => {
        triggerHaptic('medium');
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation([longitude, latitude]);
            mapInstance.current?.flyTo({ center: [longitude, latitude], zoom: 15, essential: true, speed: 2 });
        });
    };

    // --- RENDER ---

    // 1. Missing / No Signal
    if (mapState === 'missing' || mapState === 'error') {
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <Satellite size={48} className="text-slate-700 animate-pulse" strokeWidth={1.5} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                </div>

                <h3 className="text-lg font-bold text-slate-300 tracking-widest mb-2 font-mono">
                    NO SATELLITE DATA<span className="animate-blink">_</span>
                </h3>

                <p className="text-slate-600 text-sm max-w-xs mx-auto mb-8 leading-relaxed font-mono">
                    Local terrain cache is empty. Connection required for region acquisition.
                </p>

                <button
                    onClick={handleDownload}
                    className="group relative px-6 py-3 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-cyan-900/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center gap-3 text-cyan-500 font-mono text-sm tracking-wide">
                        <Download size={16} />
                        [ DOWNLOAD REGIONAL CACHE ]
                    </div>
                </button>
            </div>
        );
    }

    // 2. Downloading / Acquiring
    if (mapState === 'downloading') {
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 space-y-8">
                <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-xs font-mono text-cyan-500/70">
                        <span>ACQUIRING REGIONAL DATA</span>
                        <span>{Math.round(downloadProgress)}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 w-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-100 ease-linear"
                            style={{ width: `${downloadProgress}%` }}
                        />
                    </div>
                </div>

                <div className="font-mono text-xs text-slate-600 animate-pulse">
                    ESTABLISHING DOWNLINK...
                </div>
            </div>
        );
    }

    // 3. Mounting (Glitch Transition)
    if (mapState === 'mounting') {
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                <div className="relative">
                    <div className="text-4xl text-cyan-500 font-black tracking-tighter opacity-50 glitch-text" data-text="SYSTEM LINK">
                        SYSTEM LINK
                    </div>
                </div>
                {/* Inline CSS for glitch effect to avoid external dependency issues if css missing */}
                <style>{`
                    .glitch-text {
                        animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
                    }
                    @keyframes glitch {
                        0% { transform: translate(0) }
                        20% { transform: translate(-2px, 2px) }
                        40% { transform: translate(-2px, -2px) }
                        60% { transform: translate(2px, 2px) }
                        80% { transform: translate(2px, -2px) }
                        100% { transform: translate(0) }
                    }
                `}</style>
            </div>
        );
    }

    // 4. Ready (Map)
    return (
        <div className="relative w-full h-full bg-slate-950 overflow-hidden">
            {/* Map Container */}
            <div
                ref={mapContainer}
                className={`w-full h-full transition-opacity duration-1000 ${mapState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* HUD Overlay - Signal Status */}
            <div className="absolute top-4 left-4 pointer-events-none z-10">
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500/50 bg-slate-950/50 px-2 py-1 rounded backdrop-blur border border-cyan-900/30">
                    <Radio size={12} className="animate-pulse" />
                    <span>SIGNAL: OPTIMAL</span>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-10 print:hidden">
                <button
                    onClick={handleLocate}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-full text-cyan-500 shadow-lg active:scale-95 transition-all"
                >
                    <Navigation2 size={20} className={userLocation ? "fill-current" : ""} />
                </button>

                <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-full overflow-hidden shadow-lg">
                    <button onClick={() => handleZoom(1)} className="w-12 h-12 flex items-center justify-center text-slate-400 border-b border-slate-800 active:bg-slate-800 transition-colors">
                        <Plus size={20} />
                    </button>
                    <button onClick={() => handleZoom(-1)} className="w-12 h-12 flex items-center justify-center text-slate-400 active:bg-slate-800 transition-colors">
                        <Minus size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfflineMap;
