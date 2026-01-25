import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader } from 'lucide-react';
import ProtocolView from '../components/ProtocolView';
import { ProtocolGenerator } from '../services/ai/ProtocolGenerator';
import { getScenario } from '../services/ai/scenarioTemplates';
import { createLogger } from '../utils/logger';

const log = createLogger('ProtocolPage');

/**
 * Protocol Page Component
 *
 * Route handler for /protocol/:scenarioId
 * Orchestrates protocol generation → display flow
 *
 * Flow:
 * 1. Extract scenarioId from URL params
 * 2. Generate protocol (AI or fallback)
 * 3. Display ProtocolView with results
 * 4. Handle regeneration requests
 */
const ProtocolPage = () => {
    const { scenarioId } = useParams();
    const navigate = useNavigate();

    const [protocol, setProtocol] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scenario, setScenario] = useState(null);

    // Generate protocol on mount
    useEffect(() => {
        generateProtocol();
    }, [scenarioId]);

    const generateProtocol = async () => {
        try {
            setLoading(true);
            setError(null);

            log.info('Generating protocol', { scenarioId });

            // Validate scenario
            const scenarioData = getScenario(scenarioId);
            if (!scenarioData) {
                throw new Error(`Unknown scenario: ${scenarioId}`);
            }
            setScenario(scenarioData);

            // Generate protocol (with user context integration)
            const result = await ProtocolGenerator.generate(scenarioId, {
                useAI: true,
                maxRetries: 1
            });

            log.info('Protocol generated successfully', {
                scenarioId,
                stepCount: result.steps?.length,
                usedAI: result.usedAI
            });

            setProtocol(result);

        } catch (err) {
            log.error('Protocol generation failed', err);
            setError(err.message || 'Failed to generate protocol');

            // Attempt fallback
            try {
                const scenarioData = getScenario(scenarioId);
                if (scenarioData) {
                    const fallback = await ProtocolGenerator.generate(scenarioId, {
                        useAI: false
                    });
                    setProtocol(fallback);
                    setError(null); // Clear error if fallback succeeds
                }
            } catch (fallbackErr) {
                log.error('Fallback generation failed', fallbackErr);
            }

        } finally {
            setLoading(false);
        }
    };

    // Handle regeneration (user clicks "Regenerate" button)
    const handleRegenerate = async () => {
        log.info('Regenerating protocol', { scenarioId });
        await generateProtocol();
    };

    // Handle close (return to previous page)
    const handleClose = () => {
        navigate(-1); // Go back to previous page
    };

    // Loading state
    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
                <Loader className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                <p className="text-2xl font-bold text-slate-900 mb-2">
                    Generating Protocol
                </p>
                {scenario && (
                    <p className="text-lg text-slate-500">
                        {scenario.name}
                    </p>
                )}
                <p className="text-sm text-slate-400 mt-4">
                    Analyzing your context and preparing steps...
                </p>
            </div>
        );
    }

    // Error state (with fallback attempt)
    if (error && !protocol) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
                <AlertTriangle className="w-16 h-16 text-red-600 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Protocol Generation Failed
                </h1>
                <p className="text-lg text-slate-600 text-center mb-6 max-w-md">
                    {error}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleRegenerate}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-white border-2 border-slate-300 rounded-lg font-medium hover:border-slate-400 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Success state - display protocol
    return (
        <ProtocolView
            protocol={protocol}
            onClose={handleClose}
            onRegenerate={handleRegenerate}
        />
    );
};

export default ProtocolPage;
