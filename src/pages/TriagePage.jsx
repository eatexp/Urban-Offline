import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TriageScreen from '../components/TriageScreen';

const TriagePage = () => {
    const { '*': storyPath } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get urgency from navigation state (passed from EmergencyCommandBar or Search)
    const urgency = location.state?.urgency || 5;

    return (
        <div className="page-container py-4 flex justify-center">
            <div className="w-full max-w-lg">
                <TriageScreen
                    storyFile={storyPath}
                    onClose={() => navigate(-1)}
                    urgency={urgency}
                />
            </div>
        </div>
    );
};

export default TriagePage;

