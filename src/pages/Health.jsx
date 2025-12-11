import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Thermometer } from 'lucide-react';

const Health = () => {

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>
                    <div className="module-card-icon red" style={{ marginRight: '0.75rem' }}>
                        <Heart size={24} />
                    </div>
                    Health & First Aid
                </h1>
                <p>Emergency medical protocols and triage.</p>
            </header>

            <div className="flex flex-col gap-md">
                {/* Dynamically mapped from TriageRouter in future */}
                <Link
                    to="/triage/hypothermia.ink.json"
                    className="module-card"
                >
                    <div className="module-card-icon blue">
                        <Thermometer size={24} />
                    </div>
                    <div className="module-card-content">
                        <h3>Hypothermia Triage</h3>
                        <p>Assess and treat cold exposure.</p>
                    </div>
                </Link>

                {/* Placeholder for others */}
                <div className="placeholder-card">
                    More Triage Flows Coming Soon
                </div>
            </div>
        </div>
    );
};

export default Health;
