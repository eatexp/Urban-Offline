import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileArchive, Loader, CheckCircle, XCircle, Trash2, AlertCircle } from 'lucide-react';
import { ContentPackManager } from '../services/contentPacks/ContentPackManager';

/**
 * ZimImportManager - UI for importing ZIM files
 * 
 * Features:
 * - Drag-and-drop ZIM file upload
 * - Progress tracking during import
 * - List of imported ZIM files
 * - Uninstall/remove imported ZIMs
 */
export const ZimImportManager = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ percent: 0, message: '' });
  const [importResult, setImportResult] = useState(null);
  const [zimImports, setZimImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Load existing ZIM imports on mount
  const loadZimImports = useCallback(async () => {
    try {
      setLoading(true);
      const imports = await ContentPackManager.getZimImports();
      setZimImports(imports);
    } catch (error) {
      console.error('Failed to load ZIM imports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZimImports();
  }, [loadZimImports]);

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const zimFile = files.find(f => f.name.endsWith('.zim'));

    if (zimFile) {
      handleImport(zimFile);
    } else {
      setImportResult({
        success: false,
        error: 'Please drop a .zim file'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  // Import ZIM file
  const handleImport = async (file) => {
    setImporting(true);
    setImportProgress({ percent: 0, message: 'Starting...' });
    setImportResult(null);

    try {
      const result = await ContentPackManager.importZimFile(file, (percent, message) => {
        setImportProgress({ percent, message });
      });

      setImportResult(result);

      if (result.success) {
        // Refresh the list
        await loadZimImports();
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error.message || 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  // Uninstall ZIM import
  const handleUninstall = async (packId) => {
    if (!confirm('Are you sure you want to remove this ZIM import? This will delete all imported articles.')) {
      return;
    }

    try {
      const result = await ContentPackManager.uninstallZimImport(packId);
      if (result.success) {
        await loadZimImports();
      } else {
        alert('Failed to uninstall: ' + result.error);
      }
    } catch (error) {
      alert('Failed to uninstall: ' + error.message);
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="zim-import-manager">
        <div className="loading-state">
          <Loader className="spin" size={24} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="zim-import-manager">
      <h2 className="section-title">Import ZIM Archives</h2>
      <p className="section-description">
        Import Wikipedia, StackOverflow, or other ZIM archives for offline access.
        Download ZIM files from <a href="https://library.kiwix.org" target="_blank" rel="noopener">library.kiwix.org</a>
      </p>

      {/* Upload Area */}
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${importing ? 'importing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!importing ? openFilePicker : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zim"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {importing ? (
          <div className="import-progress">
            <Loader className="spin" size={32} />
            <div className="progress-info">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${importProgress.percent}%` }}
                />
              </div>
              <span className="progress-message">{importProgress.message}</span>
              <span className="progress-percent">{importProgress.percent}%</span>
            </div>
          </div>
        ) : (
          <>
            <Upload size={48} className="upload-icon" />
            <p className="upload-text">
              <strong>Drop a ZIM file here</strong> or click to browse
            </p>
            <p className="upload-hint">
              Supports Wikipedia, StackOverflow, TED Talks, and more
            </p>
          </>
        )}
      </div>

      {/* Import Result */}
      {importResult && !importing && (
        <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
          {importResult.success ? (
            <>
              <CheckCircle size={20} />
              <div className="result-details">
                <strong>Import successful!</strong>
                <p>
                  Imported {importResult.stats?.importedArticles} articles from{' '}
                  {importResult.stats?.fileName} ({importResult.stats?.fileSize})
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle size={20} />
              <div className="result-details">
                <strong>Import failed</strong>
                <p>{importResult.error}</p>
              </div>
            </>
          )}
          <button
            className="btn-close"
            onClick={() => setImportResult(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Storage Warning */}
      {zimImports.length > 0 && (
        <div className="storage-info">
          <AlertCircle size={16} />
          <span>
            {zimImports.length} ZIM {zimImports.length === 1 ? 'archive' : 'archives'} imported
          </span>
        </div>
      )}

      {/* Imported ZIM List */}
      {zimImports.length > 0 && (
        <div className="zim-list">
          <h3>Imported ZIM Archives</h3>
          {zimImports.map((zim) => (
            <div key={zim.id} className="zim-item">
              <div className="zim-info">
                <FileArchive size={24} className="zim-icon" />
                <div className="zim-details">
                  <span className="zim-name">{zim.name}</span>
                  <span className="zim-meta">
                    {zim.articleCount} articles • {zim.sizeDisplay} •{' '}
                    {new Date(zim.installedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                className="btn-uninstall"
                onClick={() => handleUninstall(zim.id)}
                title="Remove ZIM import"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {zimImports.length === 0 && !importing && !importResult && (
        <div className="empty-state">
          <p>No ZIM archives imported yet.</p>
          <p className="empty-hint">
            ZIM files are compressed archives of websites like Wikipedia.
            <br />
            Great for offline emergency reference!
          </p>
        </div>
      )}
    </div>
  );
};

export default ZimImportManager;
