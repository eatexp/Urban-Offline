import MapComponent from '../components/MapComponent';

const Map = () => {
    return (
        <div className="page-container h-[calc(100vh-140px)] flex flex-col">
            <h1 className="text-lg font-bold mb-4">Offline Map</h1>
            <div className="card shadow-sm rounded-md flex-1 overflow-hidden relative">
                <MapComponent />
            </div>
        </div>
    );
};

export default Map;
