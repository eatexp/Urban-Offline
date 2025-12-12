import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TriageScreen from '../components/TriageScreen';
import { TRIAGE_ROUTES } from '../services/triage/TriageRouter';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

// Build allowed stories list from triage routes for validation
const ALLOWED_STORIES = TRIAGE_ROUTES.map(route => route.story);

// Validate story ID to prevent path traversal attacks
const isValidStoryId = (storyId) => {
    if (!storyId) return false;

    // Check against allowlist
    if (ALLOWED_STORIES.includes(storyId)) return true;

    // Additional security checks for any story not in the list
    // Prevent path traversal
    if (storyId.includes('..')) return false;
    if (storyId.includes('//')) return false;

    // Must be a .ink.json file in expected format
    if (!storyId.endsWith('.ink.json')) return false;

    // Only allow alphanumeric, hyphens, underscores, and forward slashes
    const validPattern = /^[a-zA-Z0-9\-_/]+\.ink\.json$/;
    if (!validPattern.test(storyId)) return false;

    return true;
};

const TriagePage = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();

    // Validate story ID
    if (!isValidStoryId(storyId)) {
        return (
            <div className="page-container flex flex-col items-center justify-center text-center" style={{ minHeight: '50vh' }}>
                <AlertTriangle size={48} className="text-muted mb-4" style={{ color: 'var(--color-warning)' }} />
                <h2 className="text-xl font-bold mb-2">Guide Not Found</h2>
                <p className="text-muted mb-6">
                    The requested triage guide doesn't exist or is unavailable.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary flex items-center gap-sm"
                >
                    <ArrowLeft size={16} />
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ padding: '1rem' }}>
            <div className="w-full max-w-lg mx-auto">
                <TriageScreen
                    storyFile={storyId}
                    onClose={() => navigate(-1)}
                />
            </div>
        </div>
    );
};

export default TriagePage;
