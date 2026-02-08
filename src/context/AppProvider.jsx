import React, { createContext, useContext, useEffect, useState } from 'react';
import { initStorage } from '../services/db';
import { SearchService } from '../services/SearchService';
import { Capacitor } from '@capacitor/core';
import { getDBConnection } from '../services/storage/NativeStorage';
import { createLogger } from '../utils/logger';

const log = createLogger('AppProvider');

const AppContext = createContext({
    status: 'idle', // 'idle' | 'initializing' | 'ready' | 'error'
    error: null,
    isOnline: navigator.onLine
});

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Network status listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Independent async indexing
    const indexNativeArticles = async (db) => {
        const articles = await db.query('SELECT id, slug, title, body_plain FROM articles LIMIT 1000');
        if (articles.values && articles.values.length > 0) {
            for (const article of articles.values) {
                await SearchService.addDocument({
                    id: article.id,
                    slug: article.slug,
                    title: article.title,
                    content: article.body_plain || '',
                    description: article.title,
                    category: 'health'
                });
            }
            log.info(`Indexed ${articles.values.length} articles from SQLite`);
            localStorage.setItem('native_index_complete', 'true');
        }
    };

    // Initialization Logic
    useEffect(() => {
        const init = async () => {
            try {
                setStatus('initializing');
                log.info('Starting app initialization...');

                // 1. Storage Init
                await initStorage();
                log.info('Storage system ready');

                // 2. Search Service Init (Non-critical, can run in background in theory, but we await for consistency)
                await SearchService.init();
                log.info('Search service ready');

                // 3. Native Article Indexing (Fire and forget, or non-blocking?)
                // We'll keep it awaited but wrapped in try/catch to not block "ready" state if it fails slightly
                if (Capacitor.isNativePlatform()) {
                    try {
                        const db = await getDBConnection();
                        // Check if we need to index
                        const isIndexed = localStorage.getItem('native_index_complete');
                        if (!isIndexed) {
                            log.info('Starting native article indexing...');
                            // We run this without awaiting the *results* to block UI, 
                            // but for now let's keep it simple: just do a quick check.
                            // Actually, let's allow the app to boot even if this is running.
                            indexNativeArticles(db).catch(err => log.warn('Background indexing error', err));
                        }
                    } catch (e) {
                        log.warn('Native indexing setup failed', e);
                    }
                }

                setStatus('ready');
            } catch (e) {
                log.error('Critical Initialization Failure', e);
                setError(e);
                setStatus('error');
            }
        };

        if (status === 'idle') {
            init();
        }
    }, [status]);



    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6">
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/50 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">CRITICAL SYSTEM FAILURE</h2>
                    <p className="text-slate-300 mb-6">The storage system could not be initialized.</p>
                    <div className="bg-slate-950 p-4 rounded text-left font-mono text-xs text-red-400 mb-6 overflow-auto max-h-32">
                        {error?.message || 'Unknown Error'}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold w-full transition-colors"
                    >
                        ATTEMPT RESET
                    </button>
                    <p className="mt-4 text-xs text-slate-500">
                        If this persists, standard web fallback will attempt to load key modules.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'initializing' || status === 'idle') {
        // High-performance loading skeleton
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-orange-500 rounded-sm animate-pulse"></div>
                    </div>
                </div>
                <h2 className="text-orange-500 font-bold tracking-[0.2em] text-sm animate-pulse">INITIALIZING SYSTEMS</h2>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ status, error, isOnline }}>
            {children}
        </AppContext.Provider>
    );
};
