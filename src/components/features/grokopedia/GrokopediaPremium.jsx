/**
 * GrokopediaPremium - Premium Knowledge Base Explorer
 * 
 * Enhanced with:
 * - Theme system integration with category colors
 * - Medical (teal), Survival (olive), Legal (amber) color coding
 * - Enhanced haptic feedback on interactions
 * - Platform-specific animations
 * - Improved article reader with premium typography
 * 
 * Compliance: .clinerules §4 - Content Pack integration
 *             .clinerules §6 - Native haptics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Book, Search, Library, Clock, ChevronRight,
  ArrowLeft, AlertCircle, X, FileText, Stethoscope,
  Scale, Compass
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ZimContentService } from '../services/grokopedia/ZimContentService';
import { HapticsService } from '../services/HapticsService';
import { useCategoryColor, useAnimationConfig } from '../contexts/ThemeContext';

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

const CATEGORY_CONFIG = {
  medical: {
    name: 'Medical',
    icon: Stethoscope,
    color: 'teal',
    description: 'Health, first aid, and medical information',
  },
  survival: {
    name: 'Survival',
    icon: Compass,
    color: 'olive',
    description: 'Wilderness and urban survival guides',
  },
  legal: {
    name: 'Legal',
    icon: Scale,
    color: 'amber',
    description: 'Rights, laws, and legal procedures',
  },
  general: {
    name: 'General',
    icon: Book,
    color: 'indigo',
    description: 'General reference and knowledge',
  },
  emergency: {
    name: 'Emergency',
    icon: AlertCircle,
    color: 'red',
    description: 'Critical emergency protocols',
  },
};

const getCategoryConfig = (category) => {
  return CATEGORY_CONFIG[category?.toLowerCase()] || CATEGORY_CONFIG.general;
};

// =============================================================================
// PACK CARD COMPONENT
// =============================================================================

const PackCard = ({ pack, onClick, index, animationConfig }) => {
  const config = getCategoryConfig(pack.category);
  const Icon = config.icon;
  const colors = useCategoryColor(pack.category);
  const { getSpringProps } = animationConfig;

  return (
    <motion.div
      {...getSpringProps({ delay: index * animationConfig.stagger })}
      layout
      whileHover={{ scale: animationConfig.scale.hover, y: -4 }}
      whileTap={{ scale: animationConfig.scale.tap }}
      onClick={async () => {
        await HapticsService.impact('light');
        onClick(pack.id);
      }}
      className="relative rounded-2xl border p-5 cursor-pointer overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(15, 23, 42, 0.95) 100%)`,
        borderColor: colors.border,
      }}
    >
      {/* Glow effect for optimal match */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 60px ${colors.bg}` }}
      />

      {/* Decorative background icon */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-32 h-32" style={{ color: colors.primary }} />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center border backdrop-blur-sm transition-transform group-hover:scale-110"
            style={{
              background: colors.bg,
              borderColor: colors.border,
              color: colors.primary
            }}
          >
            <Icon size={28} />
          </div>
          {pack.lastAccessed && (
            <div className="flex items-center gap-1 text-xs text-white/50 bg-black/20 px-2 py-1 rounded-full">
              <Clock size={10} />
              Recently
            </div>
          )}
        </div>

        <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-white/90 transition-colors">
          {pack.name}
        </h3>
        <p className="text-sm text-white/60 line-clamp-2 mb-4 leading-relaxed">
          {pack.description}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span
            className="px-2 py-1 rounded-full font-medium"
            style={{
              background: colors.bg,
              color: colors.primary
            }}
          >
            {pack.articleCount.toLocaleString()} articles
          </span>
          <span className="text-white/40">{pack.sizeDisplay}</span>
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// ARTICLE LIST ITEM
// =============================================================================

const ArticleItem = ({ article, onClick, showPack = false, index, animationConfig }) => {
  const { getSpringProps } = animationConfig;

  return (
    <motion.div
      {...getSpringProps({ delay: index * (animationConfig.stagger / 2) })}
      layout
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.99 }}
      onClick={async () => {
        await HapticsService.impact('light');
        onClick(article.id);
      }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-white/20 transition-colors">
        <FileText size={20} className="text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
          {article.title}
        </h4>
        {showPack && article.packName && (
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Library size={10} />
            {article.packName}
          </p>
        )}
      </div>
      <ChevronRight size={20} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
    </motion.div>
  );
};

// =============================================================================
// SEARCH RESULT ITEM
// =============================================================================

const SearchResultItem = ({ result, onClick, index, animationConfig }) => {
  const { getSpringProps } = animationConfig;

  return (
    <motion.div
      {...getSpringProps({ delay: index * (animationConfig.stagger / 2) })}
      layout
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.99 }}
      onClick={async () => {
        await HapticsService.impact('light');
        onClick(result.id);
      }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5">
          <Search size={16} className="text-blue-400" />
        </div>
        <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors flex-1">
          {result.title}
        </h4>
        <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
          {Math.round(result.score)}% match
        </div>
      </div>
      <p className="text-sm text-slate-500 line-clamp-2 pl-13 leading-relaxed">
        {result.snippet}
      </p>
    </motion.div>
  );
};

// =============================================================================
// ALPHABETICAL INDEX
// =============================================================================

const AlphabeticalIndex = ({ packId, onSelectArticle, animationConfig }) => {
  const [index, setIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const letters = Object.keys(index).sort();

  return (
    <div className="space-y-6">
      {/* Quick jump alphabet */}
      <div className="sticky top-0 z-10 py-2 bg-slate-900/95 backdrop-blur-lg border-b border-white/5 -mx-4 px-4">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {letters.map((letter) => (
            <motion.button
              key={letter}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                await HapticsService.selection();
                document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setSelectedLetter(letter);
              }}
              className={`
                w-8 h-8 rounded-lg text-sm font-semibold transition-all
                ${selectedLetter === letter
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }
              `}
            >
              {letter}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        <AnimatePresence>
          {letters.map((letter) => (
            <motion.div
              key={letter}
              id={`letter-${letter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-3xl font-bold text-slate-700 mb-4 sticky top-16 bg-slate-900/95 py-2 backdrop-blur-sm">
                {letter}
              </h3>
              <div className="grid gap-2">
                <AnimatePresence>
                  {index[letter].map((article, i) => (
                    <ArticleItem
                      key={article.id}
                      article={article}
                      onClick={onSelectArticle}
                      index={i}
                      animationConfig={animationConfig}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const GrokopediaPremium = () => {
  const navigate = useNavigate();
  const animationConfig = useAnimationConfig();

  const [view, setView] = useState('library'); // library, pack, search, article
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [installedPacks, recent] = await Promise.all([
      ZimContentService.getInstalledPacks(),
      ZimContentService.getRecentlyViewed(5)
    ]);
    setPacks(installedPacks);
    setRecentArticles(recent);
  };

  useEffect(() => {
    const init = async () => {
      await ZimContentService.init();
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  const handlePackSelect = useCallback(async (packId) => {
    const pack = packs.find((p) => p.id === packId);
    setSelectedPack(pack);
    setView('pack');
    await HapticsService.impact('medium');
  }, [packs]);

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

  const handleArticleSelect = useCallback(async (articleId) => {
    await HapticsService.sequence.cardSelect();
    navigate(`/grokopedia/article/${articleId}`);
  }, [navigate]);



  const handleBack = async () => {
    await HapticsService.impact('light');
    setView('library');
    setSelectedPack(null);
    setSearchQuery('');
  };

  const renderLibrary = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-purple-500/20 mb-4 border border-purple-500/30"
        >
          <Library className="w-10 h-10 text-purple-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">Grokopedia</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Browse and search your offline knowledge base. Every article can be verified by AI.
        </p>
      </div>

      {/* Recently Viewed */}
      <AnimatePresence>
        {recentArticles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Recently Viewed
              </h2>
              <button
                onClick={async () => {
                  await HapticsService.impact('light');
                  setRecentArticles([]);
                }}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {recentArticles.slice(0, 3).map((article, i) => (
                  <ArticleItem
                    key={article.id}
                    article={article}
                    onClick={handleArticleSelect}
                    showPack
                    index={i}
                    animationConfig={animationConfig}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Content Packs */}
      <section>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
          Your Library ({packs.length} {packs.length === 1 ? 'pack' : 'packs'})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {packs.map((pack, index) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onClick={handlePackSelect}
                index={index}
                animationConfig={animationConfig}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Empty state */}
      <AnimatePresence>
        {packs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-16 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Content Packs</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Download content packs from the Library to start exploring offline knowledge
            </p>
            <button
              onClick={async () => {
                await HapticsService.impact('medium');
                navigate('/library');
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:from-purple-400 hover:to-indigo-400 transition-all"
            >
              Open Library
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderPackDetail = () => {
    if (!selectedPack) return null;
    const config = getCategoryConfig(selectedPack.category);

    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4 sticky top-0 z-20 bg-slate-900/95 backdrop-blur-lg py-4 -mx-4 px-4 border-b border-white/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <config.icon size={18} style={{ color: config.color === 'teal' ? '#14b8a6' : config.color === 'olive' ? '#8b9658' : config.color === 'amber' ? '#f59e0b' : '#6366f1' }} />
              <h1 className="text-xl font-bold text-white truncate">{selectedPack.name}</h1>
            </div>
            <p className="text-sm text-slate-500">
              {selectedPack.articleCount.toLocaleString()} articles • {selectedPack.sizeDisplay}
            </p>
          </div>
        </div>

        {/* Search in pack */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder={`Search in ${selectedPack.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={async () => {
                await HapticsService.impact('light');
                setSearchQuery('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/5 hover:bg-white/10"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {searchQuery.length >= 2 ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
                  />
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {searchResults.map((result, i) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          onClick={handleArticleSelect}
                          index={i}
                          animationConfig={animationConfig}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-slate-500"
                >
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p>No results found for "{searchQuery}"</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="alphabetical"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlphabeticalIndex
                packId={selectedPack.id}
                onSelectArticle={handleArticleSelect}
                animationConfig={animationConfig}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-purple-400 border-t-transparent rounded-full mb-4"
        />
        <p className="text-slate-400">Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <AnimatePresence mode="wait">
        {view === 'library' && renderLibrary()}
        {view === 'pack' && renderPackDetail()}
      </AnimatePresence>
    </div>
  );
};

export default GrokopediaPremium;