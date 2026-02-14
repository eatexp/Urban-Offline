import React, { useState, useEffect } from 'react';
import { Map as MapIcon, Crosshair, Navigation2, ExternalLink, Globe, Hospital, Train, Building, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapCartridgeService } from '../../services/maps/MapCartridgeService';
import { cartridgePOIQueryEngine } from '../../services/maps/CartridgePOIQueryEngine';
import TactileSignatureEngine from '../../services/haptics/TactileSignatureEngine.js';

// POI type icon mapping
const POI_ICONS = {
    hospital: Hospital,
    transport: Train,
    government: Building,
    landmark: Landmark
};

/**
 * MiniMapCard - Generative UI for AI Map Integrations
 * 
 * Renders a "Tactical Radar" style map preview when the AI mentions a location.
 * 
 * 3-Tier Lookup Strategy:
 *   1. If coords provided → render directly (enriched tag)
 *   2. Else try POI search via CartridgePOIQueryEngine
 *   3. Else fallback to sector search via MapCartridgeService
 * 
 * - POI Found: Green/emerald theme with type icon
 * - Sector Found: Cyan theme (current)
 * - Missing: Red theme "Sector Not Downloaded"
 */
const MiniMapCard = ({ query, coords, zoom, _isPOI }) => {
    // Hooks must be called before any returns
    const navigate = useNavigate();
    const [mapData, setMapData] = useState(null);
    const [loading, setLoading] = useState(true);

    // RENDER GUARD: Validate props after hooks
    const isInvalidQuery = !query || typeof query !== 'string' || query.trim().length === 0;

    useEffect(() => {
        if (isInvalidQuery) {
            setLoading(false);
            return;
        }

        // Path 1: Enriched tag with coords provided - render directly
        if (coords && Array.isArray(coords) && coords.length === 2) {
            setMapData({
                title: query,
                payload: { 
                    center: coords, 
                    zoom: zoom || 16 
                },
                isPOI: true,
                poiType: null // Will be inferred from context if needed
            });
            setLoading(false);
            return;
        }

        // Path 2 & 3: Query lookup - POI first, then sector fallback
        const checkMap = async () => {
            setLoading(true);
            try {
                // Try POI search first
                const poiResult = cartridgePOIQueryEngine.queryPOI(query);
                
                if (poiResult && poiResult.confidence > 0.5) {
                    // POI match found
                    setMapData({
                        title: poiResult.poi.name,
                        payload: { 
                            center: poiResult.poi.coords, 
                            zoom: zoom || 16 
                        },
                        poiType: poiResult.poi.type,
                        isPOI: true,
                        description: poiResult.poi.description
                    });
                    setLoading(false);
                    return;
                }
                
                // Fallback: Sector search (current behavior)
                const results = await MapCartridgeService.search(query);
                const bestMatch = results.find(r => r.category === 'map') || null;
                setMapData(bestMatch);
            } catch (e) {
                console.error('MiniMap lookup failed', e);
                setMapData(null);
            } finally {
                setLoading(false);
            }
        };

        checkMap();
    }, [query, coords, zoom, isInvalidQuery]);

    // Handler: Fly to the map
    const handleFlyTo = () => {
        if (!mapData) return;
        
        // Fire map jump signature
        TactileSignatureEngine.getInstance().fire('map:jump');
        
        navigate('/map', {
            state: {
                flyTo: mapData.payload,
                cartridgeId: mapData.id
            }
        });
    };

    // Handler: Search Global (Kiwi)
    const handleSearchGlobal = () => {
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    // Render invalid query state
    if (isInvalidQuery) {
        return (
            <div className="w-full rounded-lg bg-slate-950 border border-slate-800 mt-3 mb-1 p-4">
                <p className="text-xs text-slate-500 text-center font-mono">
                    Invalid map query
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-32 rounded-lg bg-slate-900 border border-slate-800 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Crosshair className="w-6 h-6 text-slate-700 animate-spin" />
                    <span className="text-xs font-mono text-slate-600">SCANNING SECTOR...</span>
                </div>
            </div>
        );
    }

    // STATE: Map Found
    if (mapData) {
        // Validate coordinates before rendering
        const coords = mapData.payload?.center;
        const zoom = mapData.payload?.zoom;
        
        if (!coords || !Array.isArray(coords) || coords.length !== 2 
            || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
            console.warn('[MiniMapCard] Invalid coordinates in mapData:', mapData);
            return (
                <div className="w-full rounded-lg bg-slate-950 border border-amber-900/30 mt-3 mb-1 p-4">
                    <p className="text-xs text-amber-400 text-center font-mono">
                        Map data corrupted
                    </p>
                </div>
            );
        }
        
        if (typeof zoom !== 'number' || zoom < 0 || zoom > 22) {
            console.warn('[MiniMapCard] Invalid zoom in mapData:', mapData);
        }

        // Determine if this is a POI or sector card
        const isPoiCard = mapData.isPOI === true;
        
        // Get POI icon if available
        const POIIcon = isPoiCard && mapData.poiType ? POI_ICONS[mapData.poiType] : null;
        
        // Theme variants
        const theme = isPoiCard ? {
            border: 'border-emerald-900/50',
            grid: '#10b981',
            iconColor: 'text-emerald-500',
            textColor: 'text-emerald-400',
            coordColor: 'text-emerald-600',
            badge: 'bg-emerald-950/80 border-emerald-800 text-emerald-300',
            button: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
            scanline: 'emerald-500/20',
            header: 'POI LOCATED'
        } : {
            border: 'border-cyan-900/50',
            grid: '#0891b2',
            iconColor: 'text-cyan-500',
            textColor: 'text-cyan-400',
            coordColor: 'text-cyan-600',
            badge: mapData.resolution === 'high' 
                ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400',
            button: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
            scanline: 'cyan-500/20',
            header: 'SECTOR ACQUIRED'
        };

        return (
            <div
                className={`w-full relative overflow-hidden rounded-lg group cursor-pointer border ${theme.border} bg-slate-950 mt-3 mb-1`}
                onClick={handleFlyTo}
            >
                {/* Background Grid (Pseudo-Map) */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle, ${theme.grid} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Content */}
                <div className="relative p-4 flex flex-col h-40 justify-between z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            {POIIcon ? (
                                <POIIcon className={`w-4 h-4 ${theme.iconColor}`} />
                            ) : (
                                <MapIcon className={`w-4 h-4 ${theme.iconColor}`} />
                            )}
                            <span className={`font-mono text-xs ${theme.textColor} tracking-wider`}>
                                {theme.header}
                            </span>
                        </div>
                        {!isPoiCard && (
                            <div className={`px-2 py-0.5 rounded border text-[10px] font-mono ${theme.badge}`}>
                                {mapData.resolution === 'high' ? 'HIGH RES AVAILABLE' : 'GLOBAL LOW RES'}
                            </div>
                        )}
                        {isPoiCard && mapData.poiType && (
                            <div className={`px-2 py-0.5 rounded border text-[10px] font-mono ${theme.badge}`}>
                                {mapData.poiType.toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
                            {mapData.title}
                        </h3>
                        <p className={`text-xs ${theme.coordColor} font-mono`}>
                            {mapData.payload.center.map(c => c.toFixed(4)).join(', ')}
                        </p>
                        {isPoiCard && mapData.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {mapData.description}
                            </p>
                        )}
                    </div>

                    <div className="w-full">
                        <button className={`w-full py-2 border ${theme.button} text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2`}>
                            <Navigation2 className="w-3 h-3" />
                            Initiate Jump
                        </button>
                    </div>
                </div>

                {/* Scanline Overlay */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-b from-transparent to-transparent animate-scan" 
                    style={{ 
                        backgroundImage: `linear-gradient(transparent, ${isPoiCard ? 'rgba(16, 185, 129, 0.2)' : 'rgba(8, 145, 178, 0.2)'}, transparent)`,
                        backgroundSize: '100% 3px' 
                    }} 
                />
            </div>
        );
    }

    // STATE: Map Missing (Hallucination Handler)
    return (
        <div className="w-full rounded-lg bg-slate-950 border border-red-900/30 mt-3 mb-1 p-4 relative overflow-hidden">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-950/30 flex items-center justify-center flex-shrink-0 border border-red-900/50">
                    <Globe className="w-5 h-5 text-red-500/70" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-red-400 font-mono tracking-wide">
                        SECTOR NOT DOWNLOADED
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        Coordinates for "{query}" are not in local cache.
                    </p>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSearchGlobal();
                        }}
                        className="mt-3 flex items-center gap-2 text-xs text-red-400/80 hover:text-red-300 transition-colors uppercase font-mono tracking-wider"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Access Global Database
                    </button>
                </div>
            </div>
            {/* Diagonal Stripes for "Warning" feel */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #7f1d1d 0, #7f1d1d 10px, transparent 10px, transparent 20px)'
                }}
            />
        </div>
    );
};

export default MiniMapCard;
