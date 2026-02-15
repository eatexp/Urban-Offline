import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Cpu, RefreshCw, Upload, Grid3X3, List } from 'lucide-react';
import StorageBar from '../components/library/StorageBar';
import DownloadCard from '../components/library/DownloadCard';
import CategoryGrid from '../components/CategoryGrid';
import { ContentPackManager } from '../services/contentPacks/ContentPackManager';
import { AIModelManager } from '../services/ai/AIModelManager';
import TransformersEngine from '../services/ai/TransformersEngine';
import HighStakesDeleteModal, { requiresHighStakesDelete } from '../components/HighStakesDeleteModal';

const styles = `
  .library-page {
    padding: 16px;
    padding-bottom: 100px;
    max-width: 600px;
    margin: 0 auto;
  }

  .library-page h1 {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-primary, #0f172a);
    margin: 0 0 16px;
  }

  .library-tabs {
    display: flex;
    gap: 4px;
    background: var(--color-bg-tertiary, #e2e8f0);
    border-radius: 10px;
    padding: 3px;
    margin: 16px 0;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .library-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 0;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: var(--color-text-secondary, #64748b);
    transition: all 0.2s ease;
  }

  .library-tab.active {
    background: white;
    color: var(--color-text-primary, #0f172a);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .library-tab.active .library-tab-dot {
    display: block;
  }

  .library-tab-dot {
    display: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .library-tab-dot.indigo { background: #6366f1; }
  .library-tab-dot.emerald { background: #10b981; }

  .library-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0 12px;
  }

  .library-section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
  }

  .library-section-count {
    font-size: 12px;
    color: var(--color-text-secondary, #64748b);
    background: var(--color-bg-tertiary, #e2e8f0);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .library-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .library-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-text-secondary, #64748b);
  }

  .library-empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary, #e2e8f0);
  }

  .library-empty h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--color-text-primary, #0f172a);
  }

  .library-empty p {
    font-size: 13px;
    margin: 0;
  }

  .library-refresh-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--color-border, rgba(0,0,0,0.06));
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary, #64748b);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .library-refresh-btn:hover {
    background: var(--color-bg-tertiary, #e2e8f0);
  }

  @keyframes lib-spin {
    to { transform: rotate(360deg); }
  }

  .library-refresh-btn.loading svg {
    animation: lib-spin 1s linear infinite;
  }

  .library-device-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 10px;
    font-size: 12px;
    color: #92400e;
    margin-bottom: 12px;
  }
`;

export default function Library() {
    const [activeTab, setActiveTab] = useState('content');
    const [contentPacks, setContentPacks] = useState([]);
    const [aiModels, setAiModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentStorageBytes, setContentStorageBytes] = useState(0);
    const [modelStorageBytes, setModelStorageBytes] = useState(0);
    const [downloadStates, setDownloadStates] = useState(new Map());
    const [activeModelId, setActiveModelId] = useState(null);
    const [capabilities, setCapabilities] = useState(null);
    
    // High-stakes delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemTypeToDelete, setItemTypeToDelete] = useState('model'); // 'model' or 'contentPack'

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load content packs
            const packs = await ContentPackManager.getAvailablePacks();
            setContentPacks(packs);

            const contentUsage = await ContentPackManager.getStorageUsage();
            setContentStorageBytes(contentUsage.bytes);

            // Load AI models
            const caps = await AIModelManager.init();
            setCapabilities(caps);

            const models = await AIModelManager.getAvailableModels();
            setAiModels(models);

            const modelUsage = await AIModelManager.getStorageUsage();
            setModelStorageBytes(modelUsage.bytes);

            setActiveModelId(AIModelManager.getCurrentModel());
        } catch (err) {
            console.error('Library load failed', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDownloadPack = useCallback(async (packId) => {
        setDownloadStates(prev => {
            const next = new Map(prev);
            next.set(packId, { status: 'downloading', progress: 0, message: 'Starting...' });
            return next;
        });

        const result = await ContentPackManager.downloadPack(packId, (progress, message) => {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.set(packId, { status: 'downloading', progress, message });
                return next;
            });
        });

        if (result.success) {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.delete(packId);
                return next;
            });
            loadData();
        } else {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.delete(packId);
                return next;
            });
            alert(result.error || 'Download failed');
        }
    }, [loadData]);

    const handleDeletePack = useCallback(async (packId) => {
        const pack = contentPacks.find(p => p.id === packId);
        if (!pack) return;
        
        // Check if high-stakes deletion is required
        if (requiresHighStakesDelete(pack)) {
            setItemToDelete(pack);
            setItemTypeToDelete('contentPack');
            setDeleteModalOpen(true);
            return;
        }
        
        // Simple confirmation for smaller packs
        if (!confirm('Remove this content pack?')) return;
        await ContentPackManager.uninstallPack(packId);
        loadData();
    }, [loadData, contentPacks]);

    const handleConfirmDeletePack = useCallback(async () => {
        if (!itemToDelete) return;
        await ContentPackManager.uninstallPack(itemToDelete.id);
        setDeleteModalOpen(false);
        setItemToDelete(null);
        loadData();
    }, [itemToDelete, loadData]);

    const handleDownloadModel = useCallback(async (modelId) => {
        setDownloadStates(prev => {
            const next = new Map(prev);
            next.set(modelId, { status: 'downloading', progress: 0, message: 'Starting...' });
            return next;
        });

        const result = await AIModelManager.downloadModel(modelId, (progress, message) => {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.set(modelId, { status: 'downloading', progress, message });
                return next;
            });
        });

        if (result.success) {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.delete(modelId);
                return next;
            });
            loadData();
        } else {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.delete(modelId);
                return next;
            });
            if (result.error !== 'Already installed') {
                alert(result.error || 'Download failed');
            }
        }
    }, [loadData]);

    const handleDeleteModel = useCallback(async (modelId) => {
        const model = aiModels.find(m => m.id === modelId);
        if (!model) return;
        
        // Check if high-stakes deletion is required
        if (requiresHighStakesDelete(model)) {
            setItemToDelete(model);
            setItemTypeToDelete('model');
            setDeleteModalOpen(true);
            return;
        }
        
        // Simple confirmation for smaller models
        if (!confirm('Remove this AI model?')) return;
        await AIModelManager.deleteModel(modelId);
        loadData();
    }, [loadData, aiModels]);

    const handleConfirmDeleteModel = useCallback(async () => {
        if (!itemToDelete) return;
        await AIModelManager.deleteModel(itemToDelete.id);
        setDeleteModalOpen(false);
        setItemToDelete(null);
        loadData();
    }, [itemToDelete, loadData]);

    const handleActivateModel = useCallback(async (modelId) => {
        setDownloadStates(prev => {
            const next = new Map(prev);
            next.set(modelId, { status: 'downloading', progress: 0, message: 'Loading model...' });
            return next;
        });

        const result = await AIModelManager.loadModel(modelId, (progress, message) => {
            setDownloadStates(prev => {
                const next = new Map(prev);
                next.set(modelId, { status: 'downloading', progress, message });
                return next;
            });
        });

        setDownloadStates(prev => {
            const next = new Map(prev);
            next.delete(modelId);
            return next;
        });

        if (result.success) {
            setActiveModelId(modelId);
        }
    }, []);

    function getPackStatus(pack) {
        const ds = downloadStates.get(pack.id);
        if (ds) return 'downloading';
        if (pack.status === 'bundled') return 'bundled';
        if (pack.status === 'installed' || pack.status === 'INSTALLED') return 'ready';
        return 'available';
    }

    function getModelStatus(model) {
        const ds = downloadStates.get(model.id);
        if (ds) return 'downloading';
        if (model.id === activeModelId) return 'active';
        if (model.isInstalled) return 'ready';
        return 'available';
    }

    const isWindowsNative = capabilities?.isWindowsNative;

    return (
        <>
            <style>{styles}</style>
            <div className="library-page">
                <h1>Library</h1>

                <StorageBar
                    contentBytes={contentStorageBytes}
                    modelBytes={modelStorageBytes}
                />

                {/* Category Grid - Visual content discovery */}
                <div className="library-section-header" style={{ marginTop: 20 }}>
                    <span className="library-section-title">Browse by Category</span>
                </div>
                <CategoryGrid
                    packs={contentPacks}
                    models={aiModels}
                    onCategorySelect={(category) => {
                        // Switch to appropriate tab based on category
                        if (category === 'ai') {
                            setActiveTab('models');
                        } else {
                            setActiveTab('content');
                        }
                    }}
                />

                <div className="library-tabs">
                    <button
                        className={`library-tab ${activeTab === 'content' ? 'active' : ''}`}
                        onClick={() => setActiveTab('content')}
                    >
                        <div className="library-tab-dot indigo" />
                        <BookOpen size={16} />
                        Content
                    </button>
                    <button
                        className={`library-tab ${activeTab === 'models' ? 'active' : ''}`}
                        onClick={() => setActiveTab('models')}
                    >
                        <div className="library-tab-dot emerald" />
                        <Cpu size={16} />
                        AI Models
                    </button>
                </div>

                {activeTab === 'content' && (
                    <div>
                        <div className="library-section-header">
                            <span className="library-section-title">Content Packs</span>
                            <button
                                className={`library-refresh-btn ${loading ? 'loading' : ''}`}
                                onClick={loadData}
                                disabled={loading}
                            >
                                <RefreshCw size={12} />
                                Refresh
                            </button>
                        </div>

                        {contentPacks.length === 0 && !loading ? (
                            <div className="library-empty">
                                <div className="library-empty-icon">
                                    <BookOpen size={24} color="#94a3b8" />
                                </div>
                                <h3>No Content Packs</h3>
                                <p>Content packs will appear here when available.</p>
                            </div>
                        ) : (
                            <div className="library-grid">
                                {contentPacks.map(pack => {
                                    const ds = downloadStates.get(pack.id);
                                    return (
                                        <DownloadCard
                                            key={pack.id}
                                            title={pack.name}
                                            description={pack.description || `${pack.category} content pack`}
                                            size={pack.size}
                                            sizeDisplay={pack.sizeDisplay}
                                            status={getPackStatus(pack)}
                                            progress={ds?.progress || 0}
                                            progressMessage={ds?.message || ''}
                                            tags={[pack.category]}
                                            type="content"
                                            articleCount={pack.articleCount || 0}
                                            onDownload={() => handleDownloadPack(pack.id)}
                                            onDelete={getPackStatus(pack) !== 'bundled' ? () => handleDeletePack(pack.id) : null}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'models' && (
                    <div>
                        <div className="library-section-header">
                            <span className="library-section-title">AI Models</span>
                            <span className="library-section-count">
                                {aiModels.filter(m => m.isInstalled).length} / {aiModels.length} installed
                            </span>
                        </div>

                        {isWindowsNative && (
                            <div className="library-device-warning">
                                <Cpu size={16} />
                                AI models require the web version. Desktop app support coming soon.
                            </div>
                        )}

                        {aiModels.length === 0 && !loading ? (
                            <div className="library-empty">
                                <div className="library-empty-icon">
                                    <Cpu size={24} color="#94a3b8" />
                                </div>
                                <h3>No AI Models</h3>
                                <p>AI models will appear here when available.</p>
                            </div>
                        ) : (
                            <div className="library-grid">
                                {aiModels.map(model => {
                                    const ds = downloadStates.get(model.id);
                                    const memoryWarning = capabilities && model.size > 600 * 1024 * 1024
                                        && !capabilities.webGPU
                                        ? 'Large model — may be slow without WebGPU'
                                        : null;

                                    return (
                                        <DownloadCard
                                            key={model.id}
                                            title={model.name}
                                            description={model.description}
                                            size={model.size}
                                            sizeDisplay={model.sizeDisplay}
                                            status={getModelStatus(model)}
                                            progress={ds?.progress || 0}
                                            progressMessage={ds?.message || ''}
                                            tags={[model.task, `${model.contextLength} ctx`]}
                                            type="model"
                                            warning={memoryWarning}
                                            onDownload={() => handleDownloadModel(model.id)}
                                            onDelete={() => handleDeleteModel(model.id)}
                                            onActivate={model.isInstalled && model.id !== activeModelId
                                                ? () => handleActivateModel(model.id)
                                                : null
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* High Stakes Delete Modal */}
                <HighStakesDeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={itemTypeToDelete === 'model' ? handleConfirmDeleteModel : handleConfirmDeletePack}
                    item={itemToDelete}
                    itemType={itemTypeToDelete}
                />
            </div>
        </>
    );
}
