import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Download, Wifi, WifiOff, ChevronRight,
    BookOpen, AlertCircle, Loader2, Check, X,
    Heart, Shield, Flame, Zap, Wind, Droplet
} from 'lucide-react';
import { OnlineContentService } from '../services/OnlineContentService';
import { db } from '../services/db';
import { SearchService } from '../services/SearchService';
import { createLogger } from '../utils/logger';

const log = createLogger('ContentBrowser');

// Category icons with design system colors
const CATEGORY_ICONS = {
    'emergency': <Zap className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />,
    'first-aid': <Heart className="w-5 h-5" style={{ color: '#ec4899' }} />,
    'trauma': <Flame className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />,
    'poisons': <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-accent-purple)' }} />,
    'cardiology': <Heart className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />,
    'respiratory': <Wind className="w-5 h-5" style={{ color: 'var(--color-info)' }} />,
    'environmental': <Droplet className="w-5 h-5" style={{ color: '#06b6d4' }} />
};

const ContentBrowser = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryArticles, setCategoryArticles] = useState([]);
    const [featuredArticles, setFeaturedArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articlePreview, setArticlePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadingArticles, setDownloadingArticles] = useState(new Set());
    const [downloadedArticles, setDownloadedArticles] = useState(new Set());
    const [error, setError] = useState(null);

    // Monitor online status
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

    // Load categories and featured content
    useEffect(() => {
        setCategories(OnlineContentService.getCategories());

        if (isOnline) {
            loadFeatured();
        }

        // Check what's already downloaded
        checkDownloaded();
    }, [isOnline]);

    const loadFeatured = async () => {
        try {
            const featured = await OnlineContentService.getFeatured();
            setFeaturedArticles(featured);
        } catch (_e) {
            log.warn('Could not load featured articles');
        }
    };

    const checkDownloaded = async () => {
        try {
            const healthContent = await db.getAll('health_content');
            const downloaded = new Set((healthContent || []).map(a => a.title?.toLowerCase()));
            setDownloadedArticles(downloaded);
        } catch (_e) {
            // Could not check downloaded
        }
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || !isOnline) return;

        setIsLoading(true);
        setError(null);
        setSelectedCategory(null);

        try {
            const { error: searchError, results } = await OnlineContentService.search(searchQuery, 20);
            if (searchError) {
                setError(searchError);
            } else {
                setSearchResults(results);
            }
        } catch (e) {
            setError(e.message);
        }

        setIsLoading(false);
    }, [searchQuery, isOnline]);

    const handleCategorySelect = async (category) => {
        if (!isOnline) return;

        setSelectedCategory(category);
        setSearchResults([]);
        setIsLoading(true);
        setError(null);

        try {
            const { error: catError, results } = await OnlineContentService.getCategory(category.query, 30);
            if (catError) {
                setError(catError);
            } else {
                setCategoryArticles(results);
            }
        } catch (e) {
            setError(e.message);
        }

        setIsLoading(false);
    };

    const handleArticleSelect = async (article) => {
        setSelectedArticle(article);
        setArticlePreview(null);

        if (isOnline) {
            const { summary } = await OnlineContentService.getSummary(article.title);
            setArticlePreview(summary);
        }
    };

    const handleDownload = async (article) => {
        if (!isOnline || downloadingArticles.has(article.title)) return;

        setDownloadingArticles(prev => new Set([...prev, article.title]));

        try {
            const { error: fetchError, article: fullArticle } = await OnlineContentService.getFullArticle(article.title);

            if (fetchError) {
                throw new Error(fetchError);
            }

            // Save to IndexedDB
            const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await db.put('health_content', {
                id: slug,
                title: fullArticle.title,
                summary: fullArticle.plainText.substring(0, 200) + '...',
                content: fullArticle.html,
                fullText: fullArticle.plainText,
                source: 'wikipedia',
                source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                importedAt: new Date().toISOString()
            });

            // Index for search
            await SearchService.addDocument({
                id: slug,
                slug: slug,
                title: fullArticle.title,
                content: fullArticle.plainText,
                description: fullArticle.plainText.substring(0, 200),
                category: 'health'
            });

            // Update downloaded set
            setDownloadedArticles(prev => new Set([...prev, article.title.toLowerCase()]));

        } catch (e) {
            log.error('Download failed', e);
            setError(`Failed to download: ${e.message}`);
        }

        setDownloadingArticles(prev => {
            const next = new Set(prev);
            next.delete(article.title);
            return next;
        });
    };

    const isArticleDownloaded = (title) => {
        return downloadedArticles.has(title?.toLowerCase());
    };

    return (
        <div
            className="page-container p-4 pb-24 animate-slide-up"
            style={{ background: 'var(--color-bg-primary)' }}
        >
            {/* Header */}
            <header className="page-header animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                    <div className="page-header-row">
                        <div className="page-header-icon page-header-icon-info">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h1 className="page-header-title">Browse Content</h1>
                    </div>
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{
                            background: isOnline
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'var(--color-bg-tertiary)',
                            color: isOnline
                                ? 'var(--color-success)'
                                : 'var(--color-text-muted)'
                        }}
                    >
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="page-header-description">
                    {isOnline
                        ? 'Browse and download articles for offline use'
                        : 'Go online to browse and download new content'}
                </p>
            </header>

            {/* Search Bar */}
            {isOnline && (
                <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search Wikipedia medical articles..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl transition-all"
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-500)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
                    />
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ color: 'var(--color-text-muted)' }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div
                    className="mb-4 p-4 rounded-lg flex items-center gap-2 animate-fade-in"
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'var(--color-danger)'
                    }}
                >
                    <AlertCircle className="w-5 h-5" />
                    <span className="flex-1">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="transition-opacity hover:opacity-70"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Loading Spinner */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 animate-fade-in">
                    <div
                        className="w-10 h-10 rounded-full animate-spin"
                        style={{
                            borderWidth: '3px',
                            borderColor: 'var(--color-border-primary)',
                            borderTopColor: 'var(--color-primary-500)'
                        }}
                    />
                </div>
            )}

            {/* Categories */}
            {!isLoading && !searchResults.length && !selectedCategory && isOnline && (
                <section className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <h2 className="section-header mb-3">Categories</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat, index) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                className="card flex items-center gap-3 p-4 text-left transition-all hover:shadow-lg animate-scale-in"
                                style={{ animationDelay: `${150 + index * 50}ms` }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-500)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
                            >
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ background: 'var(--color-bg-tertiary)' }}
                                >
                                    {CATEGORY_ICONS[cat.id] || <BookOpen className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />}
                                </div>
                                <span
                                    className="font-medium flex-1"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {cat.name}
                                </span>
                                <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Articles */}
            {!isLoading && !searchResults.length && !selectedCategory && featuredArticles.length > 0 && (
                <section className="mb-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
                    <h2 className="section-header mb-3">Essential Articles</h2>
                    <div className="space-y-2">
                        {featuredArticles.map((article, index) => (
                            <ArticleCard
                                key={article.title}
                                article={article}
                                isDownloaded={isArticleDownloaded(article.title)}
                                isDownloading={downloadingArticles.has(article.title)}
                                onSelect={() => handleArticleSelect(article)}
                                onDownload={() => handleDownload(article)}
                                animationDelay={200 + index * 50}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
                <section className="mb-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="section-header mb-0">
                            Search Results ({searchResults.length})
                        </h2>
                        <button
                            onClick={() => setSearchResults([])}
                            className="text-sm transition-colors"
                            style={{ color: 'var(--color-primary-400)' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="space-y-2">
                        {searchResults.map((article, index) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                isDownloaded={isArticleDownloaded(article.title)}
                                isDownloading={downloadingArticles.has(article.title)}
                                onSelect={() => handleArticleSelect(article)}
                                onDownload={() => handleDownload(article)}
                                animationDelay={index * 30}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Category Articles */}
            {selectedCategory && categoryArticles.length > 0 && (
                <section className="mb-6 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={() => { setSelectedCategory(null); setCategoryArticles([]); }}
                            className="text-sm transition-colors"
                            style={{ color: 'var(--color-primary-400)' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                            ← Back
                        </button>
                        <h2 className="section-header mb-0">
                            {selectedCategory.name} ({categoryArticles.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {categoryArticles.map((article, index) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                isDownloaded={isArticleDownloaded(article.title)}
                                isDownloading={downloadingArticles.has(article.title)}
                                onSelect={() => handleArticleSelect(article)}
                                onDownload={() => handleDownload(article)}
                                animationDelay={index * 30}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Offline Message */}
            {!isOnline && (
                <div className="text-center py-12 animate-fade-in">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'var(--color-bg-secondary)' }}
                    >
                        <WifiOff className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        You're Offline
                    </h3>
                    <p
                        className="mb-6"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        Connect to the internet to browse and download new content.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-primary btn-md"
                    >
                        View Downloaded Content
                    </button>
                </div>
            )}

            {/* Article Preview Modal */}
            {selectedArticle && articlePreview && (
                <div
                    className="fixed inset-0 flex items-end sm:items-center justify-center p-4 animate-fade-in"
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 'var(--z-modal-backdrop)'
                    }}
                    onClick={(e) => e.target === e.currentTarget && (setSelectedArticle(null), setArticlePreview(null))}
                >
                    <div
                        className="card max-w-lg w-full max-h-[80vh] overflow-hidden animate-scale-in"
                        style={{
                            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                            background: 'var(--color-bg-secondary)'
                        }}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3
                                    className="text-xl font-bold pr-4"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {articlePreview.title}
                                </h3>
                                <button
                                    onClick={() => { setSelectedArticle(null); setArticlePreview(null); }}
                                    className="p-1 rounded-lg transition-colors"
                                    style={{ color: 'var(--color-text-muted)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {articlePreview.thumbnail && (
                                <img
                                    src={articlePreview.thumbnail}
                                    alt={articlePreview.title}
                                    className="w-full h-40 object-cover rounded-lg mb-4"
                                    style={{ border: '1px solid var(--color-border-primary)' }}
                                />
                            )}

                            <p
                                className="text-sm mb-6 line-clamp-4"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {articlePreview.extract}
                            </p>

                            <button
                                onClick={() => handleDownload(selectedArticle)}
                                disabled={downloadingArticles.has(selectedArticle.title) || isArticleDownloaded(selectedArticle.title)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all"
                                style={{
                                    background: isArticleDownloaded(selectedArticle.title)
                                        ? 'rgba(34, 197, 94, 0.15)'
                                        : downloadingArticles.has(selectedArticle.title)
                                        ? 'var(--color-bg-tertiary)'
                                        : 'var(--color-primary-600)',
                                    color: isArticleDownloaded(selectedArticle.title)
                                        ? 'var(--color-success)'
                                        : downloadingArticles.has(selectedArticle.title)
                                        ? 'var(--color-text-muted)'
                                        : 'white',
                                    cursor: (downloadingArticles.has(selectedArticle.title) || isArticleDownloaded(selectedArticle.title))
                                        ? 'not-allowed'
                                        : 'pointer',
                                    opacity: (downloadingArticles.has(selectedArticle.title) || isArticleDownloaded(selectedArticle.title))
                                        ? 0.8
                                        : 1
                                }}
                            >
                                {isArticleDownloaded(selectedArticle.title) ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Downloaded
                                    </>
                                ) : downloadingArticles.has(selectedArticle.title) ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Download for Offline
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Article Card Component
const ArticleCard = ({ article, isDownloaded, isDownloading, onSelect, onDownload, animationDelay = 0 }) => {
    return (
        <div
            className="card flex items-center gap-3 p-4 cursor-pointer transition-all hover:shadow-lg animate-fade-in"
            onClick={onSelect}
            style={{ animationDelay: `${animationDelay}ms` }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-primary)'}
        >
            <div className="flex-1 min-w-0">
                <h3
                    className="font-medium truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {article.title}
                </h3>
                {article.snippet && (
                    <p
                        className="text-sm truncate"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {article.snippet}
                    </p>
                )}
                {article.summary?.extract && (
                    <p
                        className="text-sm line-clamp-2"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {article.summary.extract}
                    </p>
                )}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                disabled={isDownloading || isDownloaded}
                className="p-2 rounded-lg transition-all"
                style={{
                    background: isDownloaded
                        ? 'rgba(34, 197, 94, 0.15)'
                        : isDownloading
                        ? 'var(--color-bg-tertiary)'
                        : 'rgba(59, 130, 246, 0.15)',
                    color: isDownloaded
                        ? 'var(--color-success)'
                        : isDownloading
                        ? 'var(--color-text-muted)'
                        : 'var(--color-primary-400)',
                    cursor: (isDownloading || isDownloaded) ? 'not-allowed' : 'pointer'
                }}
            >
                {isDownloaded ? (
                    <Check className="w-5 h-5" />
                ) : isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Download className="w-5 h-5" />
                )}
            </button>
        </div>
    );
};

export default ContentBrowser;
