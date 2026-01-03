import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleService } from '../services/articleService';
import { coreContentService } from '../services/coreContentService';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { createLogger } from '../utils/logger';

const log = createLogger('ArticleView');

/**
 * Simple markdown to HTML converter for core content
 */
function renderMarkdown(markdown) {
  if (!markdown) return '';

  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br>');

  // Wrap list items
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br>/g, '<p>');
  html = html.replace(/<br><\/p>/g, '</p>');

  return html;
}

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
        // Try articleService first (for fetched content)
        let data = await articleService.getArticleBySlug(slug);

        // Fall back to coreContentService (for preloaded content)
        if (!data) {
          data = await coreContentService.getBySlug(slug);
        }

        setArticle(data);

        // Check for related triage story
        if (data) {
          const searchText = data.title + ' ' + (data.body_plain || data.content || '');
          const story = TriageRouter.findTriageStory(searchText);
          setTriageStory(story);
        }
      } catch (e) {
        log.error('Failed to load article', e);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-center">
        <BookOpen className="h-12 w-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Article Not Found</h2>
        <p className="text-slate-400 mb-6">The content may not have been downloaded yet.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Determine content to display
  const htmlContent = article.body_html || renderMarkdown(article.content);
  const sourceInfo = article.source || (article.isCore ? 'Core Content' : 'Local');
  const lastUpdated = article.last_updated || article.importedAt;

  return (
    <div className="page-container">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">{article.title}</h1>
        {article.summary && (
          <p className="text-slate-400 mt-2">{article.summary}</p>
        )}
      </header>

      {/* Triage Call-to-Action */}
      {triageStory && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-300">Emergency Situation?</h3>
              <p className="text-sm text-red-300/80 mt-1">
                Start an interactive guide for step-by-step help.
              </p>
              <button
                onClick={() => navigate(`/triage/${triageStory.story}`)}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Start Guided Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-invert prose-slate max-w-none">
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>

      {/* Source Info */}
      <footer className="mt-8 pt-6 border-t border-slate-700/50 text-xs text-slate-500">
        <p>Source: {sourceInfo}</p>
        {lastUpdated && (
          <p>Updated: {new Date(lastUpdated).toLocaleDateString()}</p>
        )}
      </footer>
    </div>
  );
};

export default ArticleView;
