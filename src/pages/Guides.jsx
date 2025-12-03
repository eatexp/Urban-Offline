import React from 'react';

const Guides = () => {
  return (
    <div className="page guides">
      <h1>Emergency Guides</h1>
      <div className="flex flex-col gap-md" style={{ marginTop: 'var(--spacing-md)' }}>
        <div className="card">
          <h3 className="font-bold">CPR & Choking</h3>
          <p className="text-sm">Life-saving techniques.</p>
        </div>
        <div className="card">
          <h3 className="font-bold">Bleeding</h3>
          <p className="text-sm">Control severe bleeding.</p>
        </div>
        <div className="card">
          <h3 className="font-bold">Burns</h3>
          <p className="text-sm">Treatment for burns.</p>
        </div>
      </div>
    </div>
  );
};

export default Guides;
