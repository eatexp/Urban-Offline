import React from 'react';

const Map = () => {
  return (
    <div className="page map">
      <h1>Offline Map</h1>
      <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a' }}>
        <p>Map Placeholder</p>
      </div>
      <p className="text-sm text-center" style={{ marginTop: 'var(--spacing-sm)' }}>
        Map features will be implemented in a future phase.
      </p>
    </div>
  );
};

export default Map;
