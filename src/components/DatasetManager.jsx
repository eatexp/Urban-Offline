import { useState, useEffect } from 'react';
import { Download, Trash2, Check, Loader } from 'lucide-react';
import { dataManager } from '../services/dataManager';

const DatasetManager = () => {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const loadDatasets = async () => {
        try {
            const data = await dataManager.getAvailableDatasets();
            setDatasets(data);
        } catch (error) {
            console.error('Failed to load datasets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDatasets();
    }, []);

    const handleInstall = async (id) => {
        setProcessing(id);
        try {
            await dataManager.installDataset(id);
            await loadDatasets();
        } catch (error) {
            console.error('Install failed:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleUninstall = async (id) => {
        setProcessing(id);
        try {
            await dataManager.uninstallDataset(id);
            await loadDatasets();
        } catch (error) {
            console.error('Uninstall failed:', error);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="text-center p-4">Loading datasets...</div>;

    return (
        <div className="dataset-manager">
            <h2 className="text-lg font-bold mb-4">Offline Datasets</h2>
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
                                >
                                    {processing === dataset.id ? <Loader className="spin" size={20} /> : <Trash2 size={20} />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleInstall(dataset.id)}
                                    disabled={processing === dataset.id}
                                    className="btn btn-primary"
                                    title="Download"
                                >
                                    {processing === dataset.id ? <Loader className="spin" size={20} /> : <Download size={20} />}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DatasetManager;
