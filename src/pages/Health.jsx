import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Thermometer, HeartPulse, Droplets, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { coreContentService } from '../services/coreContentService';

const Health = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const healthStories = TriageRouter.getStoriesByCategory('health');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await coreContentService.getByCategory('health');
        setArticles(content);
      } catch (error) {
        console.error('Failed to load health content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const getIcon = (storyName) => {
    if (storyName.includes('cpr')) return HeartPulse;
    if (storyName.includes('bleeding')) return Droplets;
    if (storyName.includes('choking')) return AlertCircle;
    if (storyName.includes('hypothermia')) return Thermometer;
    return Activity;
  };

  const getTitle = (storyName) => {
    if (storyName.includes('cpr')) return 'CPR & Cardiac Arrest';
    if (storyName.includes('bleeding')) return 'Severe Bleeding Control';
    if (storyName.includes('choking')) return 'Choking Emergency';
    if (storyName.includes('hypothermia')) return 'Hypothermia Triage';
    return 'Medical Emergency';
  };

  const getDescription = (storyName) => {
    if (storyName.includes('cpr')) return 'Cardiopulmonary resuscitation for unresponsive victims.';
    if (storyName.includes('bleeding')) return 'Control severe bleeding and apply pressure.';
    if (storyName.includes('choking')) return 'Heimlich maneuver and airway obstruction.';
    if (storyName.includes('hypothermia')) return 'Assess and treat cold exposure.';
    return 'Emergency medical protocol.';
  };

  return (
    <div className="page-container">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
            <Heart size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Health & First Aid</h1>
        </div>
        <p className="text-sm text-slate-400">Emergency medical protocols and essential guides.</p>
      </header>

      {/* Interactive Triage Section */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Interactive Triage</h2>
        <div className="grid gap-3">
          {healthStories.map((route) => {
            const Icon = getIcon(route.story);
            return (
              <Link
                key={route.story}
                to={`/triage/${route.story}`}
                className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-left hover:border-red-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-4"
              >
                <div className="p-3 bg-red-500/20 text-red-400 rounded-lg">
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{getTitle(route.story)}</h3>
                  <p className="text-sm text-slate-400 truncate">{getDescription(route.story)}</p>
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

export default Health;
