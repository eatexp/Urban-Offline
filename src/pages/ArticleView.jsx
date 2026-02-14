import React, { useMemo, memo } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import AskAIChip from '../components/AskAIChip';
// import { createLogger } from '../utils/logger';
import DOMPurify from 'dompurify';



// =============================================================================
// TODO: [Performance] ARTICLE_VIEW_MEMOIZATION
// What's wrong: Component re-renders on every parent update even when article
//   data hasn't changed. The triageStory computation also runs on every render.
// Why it matters: Article pages can be long, causing unnecessary computation
//   and potential scroll position resets during navigation.
// How to fix: 
//   1. Wrap component with React.memo
//   2. Memoize triageStory computation with useMemo
//   3. Consider memoizing the DOMPurify sanitization
// Priority: P2 | Effort: XS (15 min) | Impact: Medium
// =============================================================================

const ArticleView = () => {
    const article = useLoaderData();
    const navigate = useNavigate();
    const triageStory = useMemo(() => {
        if (!article) return null;
        return TriageRouter.findTriageStory(article.title + " " + (article.body_plain || ""));
    }, [article]);

    return (
        <div className="min-h-screen animate-fade-in bg-slate-900">
            {/* Glass Header */}
            <header className="sticky top-0 px-4 py-3 flex items-center shadow-lg bg-slate-900/95 backdrop-blur-lg border-b border-slate-700 z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full transition-colors text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="ml-2 text-lg font-semibold truncate text-white">
                    {article.title}
                </h1>
            </header>

            {/* Triage Call-to-Action */}
            {triageStory && (
                <div className="bg-red-900/10 border-b border-red-900/30 p-4 animate-slide-down">
                    <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500/20">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-sm font-bold text-red-400">
                                Emergency Situation?
                            </h3>
                            <p className="mt-1 text-sm text-slate-300">
                                Start an interactive guide for {triageStory.category} assessment.
                            </p>
                            <button
                                onClick={() => navigate(`/triage/${triageStory.story}`)}
                                className="mt-3 w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                Start Guided Help
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Article Content */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <article className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-blue-400 prose-strong:text-slate-200">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body_html) }} />
                </article>

                {/* Ask AI Chip */}
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <AskAIChip
                        title={article.title}
                        category={article.category || 'health'}
                        content={article.body_plain}
                        articleId={article.slug}
                        variant="expanded"
                    />
                </div>

                {/* Source Attribution */}
                <div className="mt-6 pt-4 text-xs border-t border-slate-700 text-slate-500">
                    <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="w-3 h-3" />
                        <span>Source: {article.source}</span>
                    </div>
                    <p>Last Updated: {new Date(article.last_updated).toLocaleDateString()}</p>
                </div>
            </main>
        </div>
    );
};

// TODO: [Performance] Optimize re-renders - ArticleView should be memoized
//   to prevent unnecessary re-renders when parent Layout updates. VERIFIED 2026-02-05
export default memo(ArticleView);
