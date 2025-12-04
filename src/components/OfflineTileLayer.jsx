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
                        // 2. Fallback to online URL
                        tile.src = this.getTileUrl(coords);
                    }
                }).catch(() => {
                    tile.src = this.getTileUrl(coords);
                });

                return tile;
            }
        });

        const layer = new CustomLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            className: 'map-tiles' // Keep dark mode filter
        });

        layer.addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [map]);

    return null;
};

export default OfflineTileLayer;
