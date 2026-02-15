/**
 * GrokopediaArticle - Article Reader with Premium Experience
 * 
 * Features:
 * - Clean, typography-optimized reading experience
 * - Native color scheme integration
 * - Reading progress tracking
 * - Floating AI action button
 * - Related articles
 * - Swipe navigation
 * - Text selection actions
 * 
 * Compliance: .clinerules §4 - Content Pack integration
 *             .clinerules §6 - Native performance and accessibility
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Share2, Bookmark, BookOpen, Sparkles,
    ChevronRight, Clock, MoreHorizontal, X, Check,
    Brain, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ZimContentService } from '../services/grokopedia/ZimContentService';
import { HapticsService, ImpactStyle } from '../services/HapticsService';
import { triggerHaptic } from '../utils/haptics';
import { createLogger } from '../utils/logger';

const log = createLogger('GrokopediaArticle');

/**
 * Reading Progress Bar Component
 */
const ReadingProgress = ({ progress }) => (
    <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
        />
    </div>
);

/**
 * Floating Action Button for AI
 */
const AIFloatingButton = ({ onClick, isVisible }) => (
    <AnimatePresence>
        {isVisible && (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center z-40"
            >
                <Brain size={24} />
            </motion.button>
        )}
    </AnimatePresence>
);

/**
 * Text Selection Toolbar
 */
const SelectionToolbar = ({ selection, onAskAI, onClose, position }) => {
    if (!selection) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ 
                top: position.top - 60,
                left: Math.min(position.left, window.innerWidth - 200)
            }}
            className="fixed z-50 bg-slate-800 border border-white/10 rounded-xl shadow-xl p-2 flex items-center gap-1"
        >
            <button
                onClick={onAskAI}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all text-sm font-medium"
            >
                <Sparkles size={14} />
                Ask AI
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

/**
 * Article Content Renderer
 */
const ArticleContent = ({ content, onLinkClick }) => {
    // Simple HTML sanitizer and renderer
    // In production, use a proper sanitization library
    const sanitizedContent = content
        ?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        ?.replace(/on\w+="[^"]*"/g, '') || '';

    return (
        <div 
            className="prose prose-invert prose-lg max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5
                prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-em:text-slate-400 prose-em:italic
                prose-ul:text-slate-300 prose-ol:text-slate-300
                prose-li:marker:text-purple-400
                prose-blockquote:border-l-4 prose-blockquote:border-purple-500/50
                prose-blockquote:bg-white/5 prose-blockquote:pl-4 prose-blockquote:py-2
                prose-blockquote:rounded-r-lg prose-blockquote:italic
                prose-img:rounded-xl prose-img:shadow-lg
                prose-table:border prose-table:border-white/10
                prose-th:bg-white/5 prose-th:text-white prose-th:p-3
                prose-td:border prose-td:border-white/10 prose-td:p-3 prose-td:text-slate-300"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            onClick={(e) => {
                const link = e.target.closest('a');
                if (link) {
                    e.preventDefault();
                    onLinkClick(link.href, link.textContent);
                }
            }}
        />
    );
};

/**
 * Related Articles Component
 */
const RelatedArticles = ({ articles, onSelect }) => {
    if (!articles?.length) return null;

    return (
        <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-400" />
                Related Articles
            </h3>
            <div className="grid gap-3">
                {articles.map(article => (
                    <motion.div
                        key={article.id}
                        whileHover={{ x: 4 }}
                        onClick={() => onSelect(article.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group"
                    >
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                        <span className="text-slate-300 group-hover:text-white transition-colors">
                            {article.title}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/**
 * Main GrokopediaArticle Component
 */
const GrokopediaArticle = () => {
    const { articleId } = useParams();
    const navigate = useNavigate();
    const articleRef = useRef(null);
    
    // State
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [readingProgress, setReadingProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showAIButton, setShowAIButton] = useState(false);
    
    // Text selection state
    const [selectedText, setSelectedText] = useState(null);
    const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });

    // Scroll progress
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Load article
    useEffect(() => {
        const loadArticle = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const data = await ZimContentService.getArticle(articleId);
                if (!data) {
                    setError('Article not found');
                    return;
                }
                
                setArticle(data);
                
                // Load related articles
                const related = await ZimContentService.getRelatedArticles(articleId, 5);
                setRelatedArticles(related);
                
                // Check bookmark status
                const bookmarks = JSON.parse(localStorage.getItem('grokopedia_bookmarks') || '[]');
                setIsBookmarked(bookmarks.includes(articleId));
                
                // Show AI button after delay
                setTimeout(() => setShowAIButton(true), 1000);
                
                HapticsService.impact(ImpactStyle.Light);
                
            } catch (err) {
                log.error('Failed to load article', err);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };
        
        loadArticle();
    }, [articleId]);

    // Track reading progress
    useEffect(() => {
        const handleScroll = () => {
            if (!articleRef.current) return;
            
            const element = articleRef.current;
            const totalHeight = element.scrollHeight - element.clientHeight;
            const scrolled = element.scrollTop;
            const progress = Math.min(100, Math.max(0, (scrolled / totalHeight) * 100));
            
            setReadingProgress(progress);
            
            // Save progress every 10%
            if (Math.floor(progress) % 10 === 0) {
                ZimContentService.updateReadingProgress(articleId, progress);
            }
        };

        const element = articleRef.current;
        if (element) {
            element.addEventListener('scroll', handleScroll);
            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, [articleId]);

    // Handle text selection
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            
            if (text.length > 0 && text.length < 500) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                setSelectedText(text);
                setSelectionPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + (rect.width / 2)
                });
            } else {
                setSelectedText(null);
            }
        };

        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, []);

    // Toggle bookmark
    const toggleBookmark = useCallback(() => {
        const bookmarks = JSON.parse(localStorage.getItem('grokopedia_bookmarks') || '[]');
        
        if (isBookmarked) {
            const updated = bookmarks.filter(id => id !== articleId);
            localStorage.setItem('grokopedia_bookmarks', JSON.stringify(updated));
            setIsBookmarked(false);
        } else {
            bookmarks.push(articleId);
            localStorage.setItem('grokopedia_bookmarks', JSON.stringify(bookmarks));
            setIsBookmarked(true);
            HapticsService.impact(ImpactStyle.Medium);
        }
    }, [articleId, isBookmarked]);

    // Handle AI ask
    const handleAskAI = useCallback((context = null) => {
        const query = context || selectedText || article?.title;
        navigate(`/ai?context=grokopedia&article=${articleId}&query=${encodeURIComponent(query)}`);
    }, [navigate, articleId, selectedText, article]);

    // Handle link click
    const handleLinkClick = useCallback(async (href, text) => {
        // Try to find article by URL/title
        const linkedArticle = await ZimContentService.getArticleByUrl(text, article?.packId);
        
        if (linkedArticle) {
            navigate(`/grokopedia/article/${linkedArticle.id}`);
        } else {
            // Could not resolve - show toast or alert
            log.info('Could not resolve link', { href, text });
        }
    }, [navigate, article]);

    // Share article
    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article?.title,
                    text: article?.description,
                    url: window.location.href
                });
            } catch (err) {
                log.debug('Share cancelled', err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(window.location.href);
            triggerHaptic('light');
        }
    }, [article]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                    <X size={32} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
                <button
                    onClick={() => navigate('/grokopedia')}
                    className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                >
                    Back to Library
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Reading Progress */}
            <ReadingProgress progress={readingProgress} />

            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5"
            >
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft size={20} className="text-slate-400" />
                        </button>
                        <span className="text-sm text-slate-500 truncate max-w-[200px]">
                            {article?.title}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded-xl transition-all ${
                                isBookmarked 
                                    ? 'bg-amber-500/20 text-amber-400' 
                                    : 'hover:bg-white/5 text-slate-400'
                            }`}
                        >
                            {isBookmarked ? <Check size={20} /> : <Bookmark size={20} />}
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-all"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Text Selection Toolbar */}
            <AnimatePresence>
                {selectedText && (
                    <SelectionToolbar
                        selection={selectedText}
                        onAskAI={() => handleAskAI()}
                        onClose={() => {
                            setSelectedText(null);
                            window.getSelection().removeAllRanges();
                        }}
                        position={selectionPosition}
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main 
                ref={articleRef}
                className="pt-24 pb-32 px-4 overflow-y-auto h-screen scroll-smooth"
            >
                <div className="max-w-3xl mx-auto">
                    {/* Article Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                            <BookOpen size={14} />
                            <span>Grokopedia</span>
                            <span>•</span>
                            <span>{article?.category || 'Article'}</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                            {article?.title}
                        </h1>
                        
                        {article?.description && (
                            <p className="text-lg text-slate-400 leading-relaxed">
                                {article.description}
                            </p>
                        )}
                    </motion.div>

                    {/* Article Body */}
                    <motion.article
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <ArticleContent 
                            content={article?.content}
                            onLinkClick={handleLinkClick}
                        />
                    </motion.article>

                    {/* Related Articles */}
                    <RelatedArticles 
                        articles={relatedArticles}
                        onSelect={(id) => navigate(`/grokopedia/article/${id}`)}
                    />

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-white/10 text-center">
                        <p className="text-sm text-slate-500">
                            Content from offline knowledge base
                        </p>
                        <Link
                            to="/grokopedia"
                            className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Library
                        </Link>
                    </div>
                </div>
            </main>

            {/* AI Floating Button */}
            <AIFloatingButton 
                onClick={() => handleAskAI()}
                isVisible={showAIButton && !selectedText}
            />
        </div>
    );
};

export default GrokopediaArticle;