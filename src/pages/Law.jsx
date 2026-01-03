import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, Search, UserCheck, FileText, ChevronRight } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { coreContentService } from '../services/coreContentService';

const Law = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const legalStories = TriageRouter.getStoriesByCategory('legal');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await coreContentService.getByCategory('law');
        setArticles(content);
      } catch (error) {
        console.error('Failed to load law content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const getIcon = (storyName) => {
    if (storyName.includes('stop-and-search')) return Search;
    if (storyName.includes('arrest')) return UserCheck;
    if (storyName.includes('custody')) return Shield;
    return Scale;
  };

  const getTitle = (storyName) => {
    if (storyName.includes('stop-and-search')) return 'Stop & Search (GOWISELY)';
    if (storyName.includes('arrest')) return 'Arrest Rights';
    if (storyName.includes('custody')) return 'Custody Welfare';
    return 'Legal Guide';
  };

  return (
    <div className="page-container">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <Scale size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Law & Rights</h1>
        </div>
        <p className="text-sm text-slate-400">Know your rights and legal protections.</p>
      </header>

      {/* Interactive Legal Guides Section */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Interactive Guides</h2>
        <div className="grid gap-3">
          {legalStories.map((item) => {
            const Icon = getIcon(item.story);
            return (
              <Link
                key={item.story}
                to={`/triage/${item.story}`}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-4"
              >
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{getTitle(item.story)}</h3>
                </div>
                <ChevronRight size={18} className="text-slate-500" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Reference Articles Section */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reference Guides</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : (
          <div className="grid gap-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.slug}`}
                className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 hover:bg-slate-800 transition-all flex items-center gap-4"
              >
                <div className="p-2 bg-slate-700 text-slate-400 rounded-lg">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white">{article.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{article.summary}</p>
                </div>
                <ChevronRight size={18} className="text-slate-600" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Law;
