/**
 * MapService.js — Tactical Radar Configuration
 * 
 * Defines the "Tactical Radar" visual style for the offline map.
 * 
 * Palette:
 * - Background: #020617 (Slate 950) - Deepest space/void
 * - Land: #0f172a (Slate 900) - Dark terrain
 * - Water: #020617 (Slate 950) - Same as void/background
 * - Roads: #1e293b (Slate 800) - Subtle grid lines
 * - Text: #64748b (Slate 500) - Muted labels
 * - Accents: #06b6d4 (Cyan 500) - Active elements
 */

import { Capacitor } from '@capacitor/core';
import { Protocol } from 'pmtiles';
import { CapacitorPMTilesSource } from './CapacitorPMTilesSource';

export const MAP_CONFIG = {
    // Default position (London)
    defaultCenter: [-0.1276, 51.5074],
    defaultZoom: 13,
    minZoom: 4,
    maxZoom: 16,
};

export const getMapStyle = (sourceUrl) => {
    return {
        version: 8,
        glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sources: {
            "protomaps": {
                type: "vector",
                url: `pmtiles://${sourceUrl}`,
                attribution: '<a href="https://protomaps.com">Protomaps</a>'
            }
        },
        layers: [
            // Background (Void)
            {
                id: "background",
                type: "background",
                paint: {
                    "background-color": "#020617" // Slate 950
                }
            },
            // Land (Dark Terrain)
            {
                id: "landuse",
                type: "fill",
                source: "protomaps",
                "source-layer": "landuse",
                paint: {
                    "fill-color": "#0f172a", // Slate 900
                    "fill-opacity": 1
                }
            },
            // Water (Void match or slightly distinct)
            {
                id: "water",
                type: "fill",
                source: "protomaps",
                "source-layer": "water",
                paint: {
                    "fill-color": "#020617", // Slate 950
                    "fill-outline-color": "#1e293b" // Subtle edge
                }
            },
            // Buildings (3D extrusion or flat)
            {
                id: "buildings",
                type: "fill",
                source: "protomaps",
                "source-layer": "buildings",
                paint: {
                    "fill-color": "#1e293b", // Slate 800
                    "fill-opacity": 0.5,
                    "fill-outline-color": "#334155"
                }
            },
            // Roads (Subtle Lines)
            {
                id: "roads",
                type: "line",
                source: "protomaps",
                "source-layer": "roads",
                paint: {
                    "line-color": "#1e293b", // Slate 800
                    "line-width": 1.5
                }
            },
            // Major Roads
            {
                id: "roads_major",
                type: "line",
                source: "protomaps",
                "source-layer": "roads",
                filter: ["==", "class", "major_road"],
                paint: {
                    "line-color": "#334155", // Slate 700
                    "line-width": 2
                }
            },
            // Place Labels (Muted)
            {
                id: "places",
                type: "symbol",
                source: "protomaps",
                "source-layer": "places",
                layout: {
                    "text-field": "{name}",
                    "text-font": ["Noto Sans Regular"],
                    "text-size": 12,
                    "text-transform": "uppercase",
                    "text-letter-spacing": 0.1
                },
                paint: {
                    "text-color": "#64748b", // Slate 500
                    "text-halo-color": "#020617",
                    "text-halo-width": 2
                }
            }
        ]
    };
};
