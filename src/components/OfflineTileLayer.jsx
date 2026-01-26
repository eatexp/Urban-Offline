import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { tileManager } from '../services/tileManager';

const OfflineTileLayer = () => {
    const map = useMap();

    useEffect(() => {
        const CustomLayer = L.TileLayer.extend({
            createTile: function (coords, done) {
                const tile = document.createElement('img');

                L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
                L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError, this, done, tile));

                if (this.options.crossOrigin || this.options.crossOrigin === '') {
                    tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
                }

                tile.alt = '';
                tile.setAttribute('role', 'presentation');

                // 1. Try to get from IndexedDB
                tileManager.getTile(coords.x, coords.y, coords.z).then(url => {
                    if (url) {
                        tile.src = url;
                    } else {
                        // TODO: Map Integration - Add visual indicator (e.g. "No Data") if tile is missing and we are offline.
                        // Ideally render a placeholder tile or canvas with "No Data" text.
                        // 2. Fallback to online URL
                        tile.src = this.getTileUrl(coords);
                    }
                }).catch(() => {
                    // TODO: Critical Map Integration - Add visual indicator (e.g. "No Data" placeholder) if tile is missing and we are offline
                    // Users need feedback when offline tiles aren't available
                    tile.src = this.getTileUrl(coords);
                });

                return tile;
            }
        });

        // Use CartoDB Dark Matter for "Premium" Dark Mode (No CSS inversion needed)
        const layer = new CustomLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        });

        layer.addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [map]);

    return null;
};

export default OfflineTileLayer;
