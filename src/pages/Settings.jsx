import { useState } from 'react';
import { User } from 'lucide-react';
import DatasetManager from '../components/DatasetManager';
import ContextSettings from '../components/ContextSettings';

const Settings = () => {
    const [showContextSettings, setShowContextSettings] = useState(false);

    return (
        <div className="page-container space-y-6">
            <h1 className="text-lg font-bold mb-4">Settings</h1>

            {/* My Context Button */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Context</h2>
                <button
                    onClick={() => setShowContextSettings(true)}
                    className="w-full flex items-center p-4 bg-white rounded-lg shadow border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group"
                >
                    <div className="bg-blue-50 p-3 rounded-xl mr-4 group-hover:bg-blue-100 transition-colors">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-slate-900">My Context</h3>
                        <p className="text-xs text-slate-500">Configure your inventory, medical profile, location, and resources</p>
                    </div>
                </button>
            </section>

            {/* Dataset Manager */}
            <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Content Management</h2>
                <DatasetManager />
            </section>

            {/* Context Settings Modal */}
            {showContextSettings && (
                <ContextSettings onClose={() => setShowContextSettings(false)} />
            )}
        </div>
    );
};

export default Settings;
