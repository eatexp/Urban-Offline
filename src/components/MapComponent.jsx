import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { dataManager } from '../services/dataManager';
import L from 'leaflet';
import { AlertTriangle } from 'lucide-react';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = () => {
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRegion, setActiveRegion] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const installed = await dataManager.getInstalledRegions();
                setRegions(installed);
                if (installed.length > 0) {
                    setActiveRegion(installed[0]);
                }
            } catch (err) {
                console.error('Failed to load map data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="text-center p-4 text-muted">Initializing Map Systems...</div>;

    // Default center: London (or active region)
    const position = activeRegion ? activeRegion.coordinates : [51.505, -0.09];
    const zoom = activeRegion ? 12 : 13;

    return (
        <div className="relative h-full w-full">
            {!activeRegion && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] glass-card flex items-center gap-sm py-2 px-4 shadow-lg border-orange-500/50">
                    <AlertTriangle size={16} className="text-primary" />
                    <span className="text-xs font-bold text-primary">OFFLINE MODE: NO REGION DATA</span>
                </div>
            )}

            <MapContainer center={position} zoom={zoom} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles"
                />

                {regions.map((region, index) => (
                    <Circle
                        key={index}
                        center={region.coordinates}
                        pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1 }}
                        radius={5000}
                    >
                        <Popup>
                            <strong>{region.name}</strong><br />
                            Offline Data Active
                        </Popup>
                    </Circle>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
