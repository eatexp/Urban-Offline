import OfflineMap from '../components/map/OfflineMap';

const Map = () => {
    return (
        <div className="page-container h-[calc(100vh-80px)] p-0 overflow-hidden flex flex-col">
            {/* 
               Full screen map container.
               Adjusted height to account for navbar/safe-area if needed, 
               but 'page-container' usually handles padding.
               For map, we want edge-to-edge inside the container.
            */}
            <OfflineMap />
        </div>
    );
};

export default Map;
