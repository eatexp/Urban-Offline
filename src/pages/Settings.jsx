import React from 'react';

const Settings = () => {
  return (
    <div className="page settings">
      <h1>Settings</h1>
      <div className="flex flex-col gap-md mt-md">
        <div className="card flex justify-between items-center">
          <span>Dark Mode</span>
          <button className="btn">Toggle</button>
        </div>
        <div className="card flex justify-between items-center">
          <span>Offline Data</span>
          <button className="btn">Manage</button>
        </div>
        <div className="card">
          <h3 className="font-bold">About</h3>
          <p className="text-sm">Offline Emergency App v0.1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
