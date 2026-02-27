import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { tileManager } from '../services/tileManager';

// Placeholder SVG for missing tiles (extracted to constant for performance)
const PLACEHOLDER_SVG = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
    '<rect fill="#1e293b" width="256" height="256"/>' +
    '<text x="128" y="128" text-anchor="middle" fill="#64748b" font-size="12">No Data</text>' +
    '</svg>'
);

// Error SVG for network failures — visually distinct from "No Data"
const ERROR_SVG = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
    '<rect fill="#1a1a2e" width="256" height="256"/>' +
    '<text x="128" y="120" text-anchor="middle" fill="#ef4444" font-size="14">⚠</text>' +
    '<text x="128" y="145" text-anchor="middle" fill="#94a3b8" font-size="11">Load failed</text>' +
    '</svg>'
);

const MAX_TILE_RETRIES = 2;

// VERIFIED: [Performance] OFFLINE_TILELAYER_OPTIMIZED - Phase 2.5c 2026-02-13
// CustomLayer class definition moved outside component to prevent re-creation on every render.
// This eliminates expensive L.TileLayer.extend() calls during re-renders.
const CustomLayer = L.TileLayer.extend({
    createTile: function (coords, done) {
        const tile = document.createElement('img');
        let retryCount = 0;

        L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));

        // On network error, retry up to MAX_TILE_RETRIES times, then show error state
        const self = this;
        const handleError = function () {
            if (retryCount < MAX_TILE_RETRIES && navigator.onLine) {
                retryCount++;
                setTimeout(() => {
                    tile.src = self.getTileUrl(coords);
                }, 500 * retryCount);
            } else {
                tile.src = navigator.onLine ? ERROR_SVG : PLACEHOLDER_SVG;
                tile.classList.add('tile-error');
                done(null, tile);
            }
        };
        L.DomEvent.on(tile, 'error', handleError);

        if (this.options.crossOrigin || this.options.crossOrigin === '') {
            tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
        }

        tile.alt = '';
        tile.setAttribute('role', 'presentation');

        // Try to get from IndexedDB
        tileManager.getTile(coords.x, coords.y, coords.z).then(url => {
            if (url) {
                tile.src = url;
            } else if (!navigator.onLine) {
                tile.src = PLACEHOLDER_SVG;
                tile.classList.add('tile-missing');
                done(null, tile);
            } else {
                // Online: try to fetch from network
                tile.src = this.getTileUrl(coords);
            }
        }).catch((err) => {
            console.debug('Tile fetch error:', coords.z, coords.x, coords.y, err?.message || err);

            if (!navigator.onLine) {
                tile.src = PLACEHOLDER_SVG;
                done(null, tile);
            } else {
                tile.src = this.getTileUrl(coords);
            }
        });

        return tile;
    }
});

const OfflineTileLayer = () => {
    const map = useMap();

    useEffect(() => {
        // Use CartoDB Dark Matter for "Premium" Dark Mode (No CSS inversion needed)
        const layer = new CustomLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        });

        layer.addTo(map);

        // Retry failed tiles when connection is restored
        const retryFailedTiles = () => {
            const errorTiles = map.getContainer().querySelectorAll('.tile-error, .tile-missing');
            if (errorTiles.length > 0) {
                layer.redraw();
            }
        };
        window.addEventListener('online', retryFailedTiles);

        return () => {
            window.removeEventListener('online', retryFailedTiles);
            map.removeLayer(layer);
        };
    }, [map]);

    return null;
};

export default OfflineTileLayer;
