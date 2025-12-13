import { useState, useEffect } from 'react';
import { guideManager } from '../services/guideManager';
import { Download, Trash2, BookOpen } from 'lucide-react';
import { LoadingSpinner, ErrorAlert } from '../components/ui';

const Guides = () => {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewingGuide, setViewingGuide] = useState(null);

    const loadGuides = async () => {
        try {
            setError(null);
            const data = await guideManager.getAvailableGuides();
            setGuides(data);
        } catch (err) {
            console.error('Failed to load guides:', err);
            setError('Failed to load guides. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGuides();
    }, []);

    const handleInstall = async (id) => {
        try {
            await guideManager.installGuide(id);
            await loadGuides();
        } catch (error) {
            console.error('Failed to install guide:', error);
        }
    };

    const handleUninstall = async (id) => {
        try {
            await guideManager.uninstallGuide(id);
            await loadGuides();
        } catch (error) {
            console.error('Failed to uninstall guide:', error);
        }
    };

    const handleView = async (id) => {
        try {
            const content = await guideManager.getInstalledGuideContent(id);
            setViewingGuide({ id, content });
        } catch (error) {
            console.error('Failed to open guide:', error);
        }
    };

    if (viewingGuide) {
        return (
            <div className="page-container">
                <button
                    onClick={() => setViewingGuide(null)}
                    className="mb-4 text-sm text-primary font-bold"
                >
                    &larr; Back to Guides
                </button>
                <div className="card bg-surface p-4 rounded-md shadow-sm prose">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {viewingGuide.content}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="text-lg font-bold mb-4">Emergency Guides</h1>

            {error && (
                <div className="mb-4">
                    <ErrorAlert
                        type="error"
                        title="Error"
                        message={error}
                        onRetry={loadGuides}
                        onDismiss={() => setError(null)}
                    />
                </div>
            )}

            {loading ? (
                <LoadingSpinner centered text="Loading guides..." />
            ) : guides.length === 0 ? (
                <p className="text-muted text-center p-8">No guides available yet.</p>
            ) : (
                <div className="dataset-list">
                    {guides.map(guide => (
                        <div key={guide.id} className="dataset-item">
                            <div className="dataset-info">
                                <h3 className="font-bold">{guide.name}</h3>
                                <p className="text-sm text-muted">{guide.description}</p>
                                <span className="badge">{guide.size}</span>
                            </div>
                            <div className="dataset-actions">
                                {guide.isInstalled ? (
                                    <div className="flex gap-sm">
                                        <button
                                            onClick={() => handleView(guide.id)}
                                            className="btn btn-primary"
                                            aria-label={`Read ${guide.name}`}
                                            title="Read Guide"
                                        >
                                            <BookOpen size={18} aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={() => handleUninstall(guide.id)}
                                            className="btn btn-danger-outline"
                                            aria-label={`Remove ${guide.name}`}
                                            title="Remove Guide"
                                        >
                                            <Trash2 size={18} aria-hidden="true" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleInstall(guide.id)}
                                        className="btn btn-primary"
                                        aria-label={`Download ${guide.name}`}
                                        title="Download Guide"
                                    >
                                        <Download size={18} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Guides;
