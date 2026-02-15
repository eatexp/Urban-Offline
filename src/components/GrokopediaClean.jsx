/**
 * GrokopediaClean - Clean Knowledge Base Explorer
 * 
 * Features:
 * - Minimal, clean design
 * - AI integration for article summaries
 * - Cross-references to AI responses
 * - Device-adaptive performance
 * 
 * Compliance: .clinerules §4 - Content Pack integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Book, Search, Library, Clock, ChevronRight, ArrowLeft, X
} from 'lucide-react';
import { ZimContentService } from '../services/grokopedia/ZimContentService';
import { createLogger } from '../utils/logger';

const log = createLogger('GrokopediaClean');

// =============================================================================
// PACK CARD COMPONENT
// =============================================================================

const PackCard = ({ pack, onClick }) => {
  const categoryStyles = {
    medical: 'border-red-200 bg-red-50 text-red-700',
    survival: 'border-amber-200 bg-amber-50 text-amber-700',
    legal: 'border-blue-200 bg-blue-50 text-blue-700',
    general: 'border-slate-200 bg-slate-50 text-slate-700',
    reference: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  };

  const style = categoryStyles[pack.category] || categoryStyles.general;

  return (
    <button
      onClick={() => onClick(pack.id)}
      className={`
        w-full text-left p-4 rounded-lg border transition-colors
        ${style}
        hover:brightness-95
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
          <Book size={20} />
        </div>
        {pack.lastAccessed && (
          <span className="text-xs opacity-60 flex items-center gap-1">
            <Clock size={10} /> Recent
          </span>
        )}
      </div>
      
      <h3 className="font-semibold mb-1">{pack.name}</h3>
      <p className="text-sm opacity-70 line-clamp-2 mb-3">{pack.description}</p>
      
      <div className="flex items-center justify-between text-xs opacity-60">
        <span>{pack.articleCount.toLocaleString()} articles</span>
        <span>{pack.sizeDisplay}</span>
      </div>
    </button>
  );
};

// =============================================================================
// ARTICLE LIST ITEM
// =============================================================================

const ArticleItem = ({ article, onClick, showPack = false }) => (
  <button
    onClick={() => onClick(article.id)}
    className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
  >
    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
      <Book size={16} className="text-indigo-600" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
        {article.title}
      </h4>
      {showPack && article.packName && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Library size={10} />
          {article.packName}
        </p>
      )}
    </div>
    <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
  </button>
);

// =============================================================================
// SEARCH RESULT ITEM
// =============================================================================

const SearchResultItem = ({ result, onClick }) => (
  <button
    onClick={() => onClick(result.id)}
    className="w-full text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors"
  >
    <div className="flex items-center justify-between mb-1">
      <h4 className="font-medium text-slate-900">{result.title}</h4>
      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
        {Math.round(result.score)}%
      </span>
    </div>
    <p className="text-sm text-slate-500 line-clamp-2">{result.snippet}</p>
  </button>
);

// =============================================================================
// ALPHABETICAL INDEX
// =============================================================================

const AlphabeticalIndex = ({ packId, onSelectArticle }) => {
  const [index, setIndex] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIndex = async () => {
      setLoading(true);
      const data = await ZimContentService.getAlphabeticalIndex(packId);
      setIndex(data);
      setLoading(false);
    };
    loadIndex();
  }, [packId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  const letters = Object.keys(index).sort();

  return (
    <div className="space-y-6">
      {/* Quick jump alphabet */}
      <div className="sticky top-0 z-10 py-2 bg-white border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {letters.map(letter => (
            <button
              key={letter}
              onClick={() => {
                document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-7 h-7 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {letters.map(letter => (
          <div key={letter} id={`letter-${letter}`}>
            <h3 className="text-2xl font-semibold text-slate-200 mb-3 sticky top-12 bg-white py-2">
              {letter}
            </h3>
            <div className="space-y-2">
              {index[letter].map((article) => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  onClick={onSelectArticle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const GrokopediaClean = () => {
  const navigate = useNavigate();
  
  // State
  const [view, setView] = useState('library');
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      await ZimContentService.init();
      const [installedPacks, recent] = await Promise.all([
        ZimContentService.getInstalledPacks(),
        ZimContentService.getRecentlyViewed(5)
      ]);
      setPacks(installedPacks);
      setRecentArticles(recent);
      setLoading(false);
    };
    init();
  }, []);

  // Handle pack selection
  const handlePackSelect = useCallback((packId) => {
    const pack = packs.find(p => p.id === packId);
    setSelectedPack(pack);
    setView('pack');
  }, [packs]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results = await ZimContentService.search(searchQuery, {
        packId: selectedPack?.id,
        limit: 20,
        includeContent: true
      });
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedPack]);

  // Handle article selection
  const handleArticleSelect = useCallback((articleId) => {
    navigate(`/grokopedia/article/${articleId}`);
  }, [navigate]);

  // Navigate to AI chat with article context
  const handleAskAI = useCallback((articleId) => {
    navigate(`/ai?context=grokopedia&article=${articleId}`);
  }, [navigate]);

  // Render library view
  const renderLibrary = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Library size={28} className="text-indigo-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Grokopedia</h1>
        <p className="text-sm text-slate-500">
          Browse and search your offline knowledge base
        </p>
      </div>

      {/* Recently Viewed */}
      {recentArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Recently Viewed
            </h2>
            <button 
              onClick={() => setRecentArticles([])}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {recentArticles.slice(0, 3).map((article) => (
              <ArticleItem 
                key={article.id} 
                article={article} 
                onClick={handleArticleSelect}
                showPack
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Packs */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Your Library ({packs.length} {packs.length === 1 ? 'pack' : 'packs'})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              onClick={handlePackSelect}
            />
          ))}
        </div>
      </section>

      {/* Empty state */}
      {packs.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Book size={24} className="text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-700 mb-1">No Content Packs</h3>
          <p className="text-sm text-slate-500 mb-4">
            Download content packs to start exploring
          </p>
          <button 
            onClick={() => navigate('/library')}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
          >
            Open Library
          </button>
        </div>
      )}
    </div>
  );

  // Render pack detail view
  const renderPackDetail = () => {
    if (!selectedPack) return null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 sticky top-0 z-20 bg-white py-3 border-b border-slate-200">
          <button
            onClick={() => setView('library')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-semibold text-slate-900">{selectedPack.name}</h1>
            <p className="text-xs text-slate-500">
              {selectedPack.articleCount.toLocaleString()} articles
            </p>
          </div>
        </div>

        {/* Search in pack */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search in ${selectedPack.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Content */}
        {searchQuery.length >= 2 ? (
          <div className="space-y-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-sm text-slate-500 mb-3">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={handleArticleSelect}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>No results for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <AlphabeticalIndex
            packId={selectedPack.id}
            onSelectArticle={handleArticleSelect}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-3" />
        <p className="text-slate-500">Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4">
      {view === 'library' && renderLibrary()}
      {view === 'pack' && renderPackDetail()}
    </div>
  );
};

export default GrokopediaClean;