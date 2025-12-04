import MapComponent from '../components/MapComponent';

const Map = () => {
    return (
        <div className="page-container" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            <h1 className="text-lg font-bold mb-4">Offline Map</h1>
            <div className="card bg-surface shadow-sm rounded-md" style={{ flex: 1, overflow: 'hidden' }}>
                <MapComponent />
            </div>
        </div>
    );
};

export default Map;
