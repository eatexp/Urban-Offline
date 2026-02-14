import { useState, useRef } from 'react';
import { User, Download, Upload, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import DatasetManager from '../components/DatasetManager';
import ContextSettings from '../components/ContextSettings';
import { createSnapshot, restoreSnapshot, downloadBlob } from '../services/BackupService';
import { clearAllHistory } from '../services/ChatHistoryService';

const Settings = () => {
    const [showContextSettings, setShowContextSettings] = useState(false);

    // ── Backup state ─────────────────────────────────────────────
    const [backupStatus, setBackupStatus] = useState(null); // 'exporting' | 'importing' | 'success' | 'error' | 'confirm'
    const [backupMessage, setBackupMessage] = useState('');
    const [missingCartridges, setMissingCartridges] = useState([]);
    const [pendingFile, setPendingFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        setBackupStatus('exporting');
        setBackupMessage('Creating snapshot…');
        try {
            const { blob, filename } = await createSnapshot();
            downloadBlob(blob, filename);
            setBackupStatus('success');
            setBackupMessage(`Exported: ${filename}`);
        } catch (e) {
            setBackupStatus('error');
            setBackupMessage(e.message);
        }
        setTimeout(() => setBackupStatus(null), 4000);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
        setBackupStatus('confirm');
        setBackupMessage(`Import "${file.name}"?`);
        e.target.value = ''; // reset for re-select
    };

    const executeRestore = async (mode) => {
        if (!pendingFile) return;
        setBackupStatus('importing');
        setBackupMessage('Restoring snapshot…');
        try {
            const result = await restoreSnapshot(pendingFile, mode);
            setPendingFile(null);
            if (result.success) {
                setMissingCartridges(result.missingCartridges || []);
                setBackupStatus('success');
                setBackupMessage(
                    `Restored ${result.stats.conversations} Conversations and ${result.stats.preferences} Preferences`
                );
            } else {
                setBackupStatus('error');
                setBackupMessage(result.warnings?.[0] || 'Restore failed');
            }
        } catch (e) {
            setBackupStatus('error');
            setBackupMessage(e.message);
        }
        setTimeout(() => {
            if (missingCartridges.length === 0) setBackupStatus(null);
        }, 4000);
    };

    const cancelImport = () => {
        setPendingFile(null);
        setBackupStatus(null);
        setBackupMessage('');
    };

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
            await clearAllHistory();
            alert('Chat history cleared.');
        }
    };

    return (
        <div className="page-container space-y-6">
            <h1 className="text-lg font-bold mb-4">Settings</h1>

            {/* My Context Button */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Context</h2>
                <button
                    onClick={() => setShowContextSettings(true)}
                    className="w-full flex items-center p-4 bg-white rounded-lg shadow border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group"
                >
                    <div className="bg-blue-50 p-3 rounded-xl mr-4 group-hover:bg-blue-100 transition-colors">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-slate-900">My Context</h3>
                        <p className="text-xs text-slate-500">Configure your inventory, medical profile, location, and resources</p>
                    </div>
                </button>
            </section>

            {/* Dataset Manager */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Content Management</h2>
                <DatasetManager />
            </section>

            {/* ── Data Backup — Ark Snapshot ─────────────────────── */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Data Backup</h2>
                <div className="space-y-2">
                    {/* Export */}
                    <button
                        onClick={handleExport}
                        disabled={backupStatus === 'exporting'}
                        className="w-full flex items-center p-4 bg-white rounded-lg shadow border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all group disabled:opacity-50"
                    >
                        <div className="bg-emerald-50 p-3 rounded-xl mr-4 group-hover:bg-emerald-100 transition-colors">
                            {backupStatus === 'exporting'
                                ? <Loader className="w-6 h-6 text-emerald-600 animate-spin" />
                                : <Download className="w-6 h-6 text-emerald-600" />
                            }
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-slate-900">Export Snapshot</h3>
                            <p className="text-xs text-slate-500">Save your settings, chat history, and context as an .ark file</p>
                        </div>
                    </button>

                    {/* Import */}
                    <button
                        onClick={handleImportClick}
                        disabled={backupStatus === 'importing'}
                        className="w-full flex items-center p-4 bg-white rounded-lg shadow border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all group disabled:opacity-50"
                    >
                        <div className="bg-amber-50 p-3 rounded-xl mr-4 group-hover:bg-amber-100 transition-colors">
                            {backupStatus === 'importing'
                                ? <Loader className="w-6 h-6 text-amber-600 animate-spin" />
                                : <Upload className="w-6 h-6 text-amber-600" />
                            }
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-slate-900">Import Snapshot</h3>
                            <p className="text-xs text-slate-500">Restore from an .ark file — chat history, context, and preferences</p>
                        </div>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".ark,.zip"
                        onChange={handleFileSelected}
                        className="hidden"
                    />
                </div>

                {/* Merge / Overwrite confirmation */}
                {backupStatus === 'confirm' && (
                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-semibold text-amber-900 mb-2">{backupMessage}</p>
                        <p className="text-xs text-amber-700 mb-3">How should existing data be handled?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => executeRestore('overwrite')}
                                className="flex-1 px-3 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                Replace All
                            </button>
                            <button
                                onClick={() => executeRestore('merge')}
                                className="flex-1 px-3 py-2 text-xs font-bold bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                Merge
                            </button>
                            <button
                                onClick={cancelImport}
                                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Status feedback */}
                {backupStatus === 'success' && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-emerald-800">{backupMessage}</span>
                    </div>
                )}
                {backupStatus === 'error' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span className="text-sm text-red-800">{backupMessage}</span>
                    </div>
                )}

                {/* Missing cartridge warnings */}
                {missingCartridges.length > 0 && (
                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Missing Cartridges
                        </p>
                        <p className="text-xs text-amber-700 mb-2">
                            These cartridges were active in your snapshot but aren't installed on this device:
                        </p>
                        <ul className="space-y-1">
                            {missingCartridges.map((name, i) => (
                                <li key={i} className="text-xs text-amber-800 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                                    {name} — <em className="text-amber-600">re-download to restore functionality</em>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setMissingCartridges([])}
                            className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </section>

            {/* ── Privacy & Storage ─────────────────────────────── */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Privacy & Storage</h2>
                <button
                    onClick={handleClearHistory}
                    className="w-full flex items-center p-4 bg-white rounded-lg shadow border border-slate-200 hover:border-red-300 hover:shadow-lg transition-all group"
                >
                    <div className="bg-red-50 p-3 rounded-xl mr-4 group-hover:bg-red-100 transition-colors">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-slate-900">Clear Chat History</h3>
                        <p className="text-xs text-slate-500">Permanently delete all conversations from this device</p>
                    </div>
                </button>
            </section>

            {/* Context Settings Modal */}
            {showContextSettings && (
                <ContextSettings onClose={() => setShowContextSettings(false)} />
            )}
        </div>
    );
};

export default Settings;

