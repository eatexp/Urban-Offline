import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Protocol Button Component
 *
 * Large, accessible emergency button for protocol generation
 * Follows Gemini's cognitive load principles:
 * - Large touch target (minimum 48pt)
 * - High contrast colors
 * - Clear iconography
 * - Simple text
 */
const ProtocolButton = ({ scenario }) => {
    const navigate = useNavigate();
    const IconComponent = scenario.icon;

    const handleClick = () => {
        navigate(`/protocol/${scenario.id}`);
    };

    // Color mapping for bg and text
    const colorClasses = {
        red: 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:border-red-300 text-red-900',
        orange: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300 text-orange-900',
        blue: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300 text-blue-900',
        amber: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300 text-amber-900'
    };

    const iconColorClasses = {
        red: 'text-red-600',
        orange: 'text-orange-600',
        blue: 'text-blue-600',
        amber: 'text-amber-600'
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full p-4 rounded-lg shadow border-2 transition-all hover:shadow-lg active:scale-95 ${
                colorClasses[scenario.color] || colorClasses.red
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <IconComponent className={`w-8 h-8 ${iconColorClasses[scenario.color] || iconColorClasses.red}`} />
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-bold text-lg leading-tight">{scenario.name}</h3>
                    <p className="text-sm opacity-75 mt-0.5">{scenario.description}</p>
                </div>
            </div>
        </button>
    );
};

export default ProtocolButton;
