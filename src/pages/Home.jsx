import { Shield, CheckCircle, Navigation, Heart, Tent, Scale, Sparkles, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { coreContentService } from '../services/coreContentService';
import { getCoreContentCount } from '../data/coreContent';

const Home = () => {
  const [contentReady, setContentReady] = useState(false);
  const counts = getCoreContentCount();

  useEffect(() => {
    // Check if content is loaded
    const checkContent = async () => {
      try {
        const health = await coreContentService.getByCategory('health');
        setContentReady(health.length > 0);
      } catch {
        setContentReady(false);
      }
    };
    checkContent();
  }, []);

  return (
    <div className="home-page space-y-6">
      {/* Status Section */}
      <section>
        <div className="glass-card relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield size={100} />
          </div>

          <div className="flex items-center gap-2 mb-2 text-green-400">
            <CheckCircle size={18} />
            <span className="text-sm font-bold uppercase">Ready Offline</span>
          </div>
          <h2 className="text-xl font-bold mb-1">Essential Guides Loaded</h2>
          <p className="text-xs text-slate-300 mb-3">
            {counts.total} core articles available without internet.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
              {counts.health} Health
            </span>
            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">
              {counts.survival} Survival
            </span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
              {counts.law} Legal
            </span>
          </div>
        </div>
      </section>

      {/* AI Assistant Card */}
      <Link
        to="/ai"
        className="flex items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg text-white hover:shadow-xl transition-all"
      >
        <div className="bg-white/20 p-3 rounded-xl mr-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">AI Assistant</h3>
          <p className="text-sm text-white/80">Ask questions about emergencies</p>
        </div>
        <Navigation className="w-5 h-5 text-white/60" />
      </Link>

      {/* Core Pillars */}
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Modules</h2>
      <div className="grid gap-4">
        <Link to="/health" className="flex items-center p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-red-500/50 hover:bg-slate-800/80 transition-all group">
          <div className="bg-red-500/20 p-3 rounded-xl mr-4 group-hover:bg-red-500/30 transition-colors">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Health & First Aid</h3>
            <p className="text-xs text-slate-400">CPR, bleeding, burns, shock & more</p>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <FileText size={14} />
            <span className="text-xs">{counts.health}</span>
          </div>
        </Link>

        <Link to="/law" className="flex items-center p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all group">
          <div className="bg-blue-500/20 p-3 rounded-xl mr-4 group-hover:bg-blue-500/30 transition-colors">
            <Scale className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Law & Rights</h3>
            <p className="text-xs text-slate-400">Police encounters, arrests, tenant rights</p>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <FileText size={14} />
            <span className="text-xs">{counts.law}</span>
          </div>
        </Link>

        <Link to="/survival" className="flex items-center p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all group">
          <div className="bg-orange-500/20 p-3 rounded-xl mr-4 group-hover:bg-orange-500/30 transition-colors">
            <Tent className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Survival & Prep</h3>
            <p className="text-xs text-slate-400">Water, shelter, power outages, floods</p>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <FileText size={14} />
            <span className="text-xs">{counts.survival}</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;
