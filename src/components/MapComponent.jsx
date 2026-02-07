import React, { useEffect, useState, Component, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { dataManager } from '../services/dataManager';
import L from 'leaflet';
import { AlertTriangle, MapPin } from 'lucide-react';
import OfflineTileLayer from './OfflineTileLayer';
import { createLogger } from '../utils/logger';

const logger = createLogger('MapComponent');

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

// Simple Error Boundary to gracefully handle Leaflet errors
class MapErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('Map error boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="flex flex-col items-center justify-center h-full w-full gap-3"
                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
                >
                    <MapPin size={48} className="opacity-50" />
                    <p className="text-sm font-medium">Map unavailable</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="text-xs px-3 py-1 rounded-lg"
                        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}
                    >
                        Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

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
                logger.error('Failed to load map data:', err);
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
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] glass-card flex items-center gap-2 py-2 px-4 shadow-lg border-orange-500/50">
                    <AlertTriangle size={16} className="text-primary" />
                    <span className="text-xs font-bold text-primary">OFFLINE MODE: NO REGION DATA</span>
                </div>
            )}

            <MapErrorBoundary>
                <MapContainer center={position} zoom={zoom} className="h-full w-full bg-slate-900">
                    <OfflineTileLayer />

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
            </MapErrorBoundary>
        </div>
    );
};

// TODO: [Performance] Optimize re-renders - Added memo wrapper to prevent expensive Leaflet re-initialization
// when parent components (Layout, navigation) trigger re-renders. VERIFIED 2026-02-02
export default memo(MapComponent);

