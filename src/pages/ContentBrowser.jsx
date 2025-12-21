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

// Category icons
const CATEGORY_ICONS = {
    'emergency': <Zap className="w-5 h-5 text-red-500" />,
    'first-aid': <Heart className="w-5 h-5 text-pink-500" />,
    'trauma': <Flame className="w-5 h-5 text-orange-500" />,
    'poisons': <AlertCircle className="w-5 h-5 text-purple-500" />,
    'cardiology': <Heart className="w-5 h-5 text-red-600" />,
    'respiratory': <Wind className="w-5 h-5 text-blue-500" />,
    'environmental': <Droplet className="w-5 h-5 text-cyan-500" />
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
        <div className="page-container py-6 pb-24">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">Browse Content</h1>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                        isOnline 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="text-slate-500">
                    {isOnline 
                        ? 'Browse and download articles for offline use' 
                        : 'Go online to browse and download new content'}
                </p>
            </div>

            {/* Search Bar */}
            {isOnline && (
                <div className="relative mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search Wikipedia medical articles..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    {searchQuery && (
                        <button 
                            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Loading Spinner */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            )}

            {/* Categories */}
            {!isLoading && !searchResults.length && !selectedCategory && isOnline && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">Categories</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
                            >
                                {CATEGORY_ICONS[cat.id] || <BookOpen className="w-5 h-5 text-slate-400" />}
                                <span className="font-medium text-slate-700">{cat.name}</span>
                                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Articles */}
            {!isLoading && !searchResults.length && !selectedCategory && featuredArticles.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">Essential Articles</h2>
                    <div className="space-y-2">
                        {featuredArticles.map(article => (
                            <ArticleCard
                                key={article.title}
                                article={article}
                                isDownloaded={isArticleDownloaded(article.title)}
                                isDownloading={downloadingArticles.has(article.title)}
                                onSelect={() => handleArticleSelect(article)}
                                onDownload={() => handleDownload(article)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Search Results ({searchResults.length})
                        </h2>
                        <button 
                            onClick={() => setSearchResults([])}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="space-y-2">
                        {searchResults.map(article => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                isDownloaded={isArticleDownloaded(article.title)}
                                isDownloading={downloadingArticles.has(article.title)}
                                onSelect={() => handleArticleSelect(article)}
                                onDownload={() => handleDownload(article)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Category Articles */}
            {selectedCategory && categoryArticles.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <button 
                            onClick={() => { setSelectedCategory(null); setCategoryArticles([]); }}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            ← Back
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {selectedCategory.name} ({categoryArticles.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {categoryArticles.map(article => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                isDownloaded={isArticleDownloaded(article.title)}
                                isDownloading={downloadingArticles.has(article.title)}
                                onSelect={() => handleArticleSelect(article)}
                                onDownload={() => handleDownload(article)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Offline Message */}
            {!isOnline && (
                <div className="text-center py-12">
                    <WifiOff className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">You're Offline</h3>
                    <p className="text-slate-500 mb-4">
                        Connect to the internet to browse and download new content.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg"
                    >
                        View Downloaded Content
                    </button>
                </div>
            )}

            {/* Article Preview Modal */}
            {selectedArticle && articlePreview && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900 pr-4">
                                    {articlePreview.title}
                                </h3>
                                <button 
                                    onClick={() => { setSelectedArticle(null); setArticlePreview(null); }}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {articlePreview.thumbnail && (
                                <img 
                                    src={articlePreview.thumbnail} 
                                    alt={articlePreview.title}
                                    className="w-full h-40 object-cover rounded-lg mb-4"
                                />
                            )}
                            
                            <p className="text-slate-600 text-sm mb-4 line-clamp-4">
                                {articlePreview.extract}
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDownload(selectedArticle)}
                                    disabled={downloadingArticles.has(selectedArticle.title) || isArticleDownloaded(selectedArticle.title)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                                        isArticleDownloaded(selectedArticle.title)
                                            ? 'bg-green-100 text-green-700'
                                            : downloadingArticles.has(selectedArticle.title)
                                            ? 'bg-slate-100 text-slate-500'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
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
                </div>
            )}
        </div>
    );
};

// Article Card Component
const ArticleCard = ({ article, isDownloaded, isDownloading, onSelect, onDownload }) => {
    return (
        <div 
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
            onClick={onSelect}
        >
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 truncate">{article.title}</h3>
                {article.snippet && (
                    <p className="text-sm text-slate-500 truncate">{article.snippet}</p>
                )}
                {article.summary?.extract && (
                    <p className="text-sm text-slate-500 line-clamp-2">{article.summary.extract}</p>
                )}
            </div>
            
            <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                disabled={isDownloading || isDownloaded}
                className={`p-2 rounded-lg transition-colors ${
                    isDownloaded
                        ? 'bg-green-100 text-green-600'
                        : isDownloading
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
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

