import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TriageScreen from '../components/TriageScreen';

const TriagePage = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
            <div className="w-full max-w-lg">
                <TriageScreen
                    storyFile={storyId}
                    onClose={() => navigate(-1)}
                />
            </div>
        </div>
    );
};

export default TriagePage;
