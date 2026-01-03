import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tent, Droplets, Flame, Radio, FileText, ChevronRight, Zap } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { coreContentService } from '../services/coreContentService';

const Survival = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const survivalStories = TriageRouter.getStoriesByCategory('survival');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await coreContentService.getByCategory('survival');
        setArticles(content);
      } catch (error) {
        console.error('Failed to load survival content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const getIcon = (storyName) => {
    if (storyName.includes('water')) return Droplets;
    if (storyName.includes('shelter')) return Tent;
    if (storyName.includes('fire')) return Flame;
    if (storyName.includes('signal')) return Radio;
    return Zap;
  };

  const getTitle = (storyName) => {
    if (storyName.includes('water')) return 'Water Purification';
    if (storyName.includes('shelter')) return 'Shelter Building';
    if (storyName.includes('fire')) return 'Fire Making';
    if (storyName.includes('signal')) return 'Emergency Signaling';
    return 'Survival Skill';
  };

  return (
    <div className="page-container">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
            <Tent size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Survival & Preparedness</h1>
        </div>
        <p className="text-sm text-slate-400">Essential skills and emergency planning guides.</p>
      </header>

      {/* Interactive Skills Section */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Interactive Skills</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {survivalStories.map((item) => {
            const Icon = getIcon(item.story);
            return (
              <Link
                key={item.story}
                to={`/triage/${item.story}`}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-orange-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-3"
              >
                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-white">{getTitle(item.story)}</span>
                </div>
                <ChevronRight size={18} className="text-slate-500" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Reference Guides Section */}
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

export default Survival;
