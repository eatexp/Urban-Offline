import React from 'react';

const Home = () => {
  return (
    <div className="page home">
      <h1>Emergency Dashboard</h1>
      <p className="text-muted mb-lg">
        Quick access to critical tools.
      </p>

      <div className="grid-2-col">
        <div className="card text-center">
          <h3 className="text-lg font-bold">First Aid</h3>
          <p className="text-sm">Medical guides</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-bold">Survival</h3>
          <p className="text-sm">Basic needs</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-bold">Map</h3>
          <p className="text-sm">Offline Area</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-bold">SOS</h3>
          <p className="text-sm">Signals</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
