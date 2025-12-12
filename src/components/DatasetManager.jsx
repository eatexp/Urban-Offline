import { useState, useEffect } from 'react';
import { Download, Trash2, Loader } from 'lucide-react';
import { dataManager } from '../services/dataManager';

const DatasetManager = () => {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [error, setError] = useState(null);

    const loadDatasets = async () => {
        try {
            setError(null);
            // Use the correct API method - getAvailableRegions instead of getAvailableDatasets
            const data = await dataManager.getAvailableRegions();
            setDatasets(data);
        } catch (err) {
            console.error('Failed to load datasets:', err);
            setError('Failed to load available datasets. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDatasets();
    }, []);

    const handleInstall = async (id) => {
        setProcessing(id);
        setError(null);
        try {
            // Use the correct API method - installRegion instead of installDataset
            await dataManager.installRegion(id);
            await loadDatasets();
        } catch (err) {
            console.error('Install failed:', err);
            setError(`Failed to install dataset: ${err.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleUninstall = async (id) => {
        setProcessing(id);
        setError(null);
        try {
            // Use the correct API method - uninstallRegion instead of uninstallDataset
            await dataManager.uninstallRegion(id);
            await loadDatasets();
        } catch (err) {
            console.error('Uninstall failed:', err);
            setError(`Failed to uninstall dataset: ${err.message}`);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-4 text-muted" role="status" aria-live="polite">
                <Loader className="spin inline-block mr-2" size={16} aria-hidden="true" />
                Loading datasets...
            </div>
        );
    }

    return (
        <div className="dataset-manager">
            <h2 className="text-lg font-bold mb-4">Offline Datasets</h2>

            {error && (
                <div
                    className="card mb-4 p-3"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)' }}
                    role="alert"
                >
                    <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
                </div>
            )}

            {datasets.length === 0 ? (
                <div className="text-center p-4 text-muted">
                    No datasets available.
                </div>
            ) : (
                <div className="dataset-list">
                    {datasets.map((dataset) => (
                        <div key={dataset.id} className="dataset-item card">
                            <div className="dataset-info">
                                <h3 className="font-bold">{dataset.name}</h3>
                                <p className="text-sm text-muted">{dataset.description}</p>
                                <span className="text-xs badge">{dataset.size}</span>
                            </div>
                            <div className="dataset-actions">
                                {dataset.isInstalled ? (
                                    <button
                                        onClick={() => handleUninstall(dataset.id)}
                                        disabled={processing === dataset.id}
                                        className="btn btn-danger-outline"
                                        title="Uninstall"
                                        aria-label={`Uninstall ${dataset.name}`}
                                    >
                                        {processing === dataset.id ? (
                                            <Loader className="spin" size={20} aria-hidden="true" />
                                        ) : (
                                            <Trash2 size={20} aria-hidden="true" />
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleInstall(dataset.id)}
                                        disabled={processing === dataset.id}
                                        className="btn btn-primary"
                                        title="Download"
                                        aria-label={`Download ${dataset.name}`}
                                    >
                                        {processing === dataset.id ? (
                                            <Loader className="spin" size={20} aria-hidden="true" />
                                        ) : (
                                            <Download size={20} aria-hidden="true" />
                                        )}
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

export default DatasetManager;
