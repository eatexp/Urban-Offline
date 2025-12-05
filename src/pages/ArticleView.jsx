import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleBySlug } from '../services/storage/NativeStorage';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';

const ArticleView = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [triageStory, setTriageStory] = useState(null);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const data = await getArticleBySlug(slug);
                setArticle(data);

                // Check for related triage story
                if (data) {
                    // Simple keyword matching against title/content for now
                    // Ideally this comes from the database triage_entry_points
                    const story = TriageRouter.findTriageStory(data.title + " " + (data.body_plain || ""));
                    setTriageStory(story);
                }
            } catch (e) {
                console.error("Failed to load article", e);
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Article Not Found</h2>
                <p className="text-gray-600 mb-6">The content likely hasn't been downloaded or was moved.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="ml-2 text-lg font-semibold text-gray-900 truncate">
                    {article.title}
                </h1>
            </header>

            {/* Triage Call-to-Action */}
            {triageStory && (
                <div className="bg-red-50 border-b border-red-100 p-4">
                    <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800">Emergency Situation?</h3>
                            <p className="mt-1 text-sm text-red-700">
                                Start an interactive guide for {triageStory.category} assessment.
                            </p>
                            <button
                                onClick={() => navigate(`/triage/${triageStory.story}`)} // Assuming Triage route is /triage/:storyId
                                className="mt-3 w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 shadow-sm transition-colors"
                            >
                                Start Guided Help
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Article Content */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <article className="prose prose-blue max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: article.body_html }} />
                </article>

                <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
                    <p>Source: {article.source}</p>
                    <p>Last Updated: {new Date(article.last_updated).toLocaleDateString()}</p>
                </div>
            </main>
        </div>
    );
};

export default ArticleView;
