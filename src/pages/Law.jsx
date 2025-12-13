import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, BookOpen, Gavel, Shield } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';

const Law = () => {
    const legalStories = TriageRouter.getStoriesByCategory('legal');

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>
                    <div className="module-card-icon blue" style={{ marginRight: '0.75rem' }}>
                        <Scale size={24} />
                    </div>
                    Law & Rights
                </h1>
                <p>Offline access to UK legislation, PACE codes, and your rights.</p>
            </header>

            <div className="grid-2">
                {/* Interactive Triage Section */}
                <div className="content-card col-span-2">
                    <h2 className="flex items-center gap-sm mb-3">
                        <Shield size={18} className="text-primary" />
                        <span className="font-bold">Interactive Legal Guides</span>
                    </h2>
                    {legalStories.length > 0 ? (
                        <div className="flex flex-col gap-sm">
                            {legalStories.map((item, index) => (
                                <Link
                                    key={item.story || index}
                                    to={`/triage/${item.story}`}
                                    className="interactive-item blue"
                                >
                                    <span className="font-medium">
                                        {item.story.includes('stop-and-search') ? 'Stop & Search (GOWISELY)' :
                                            item.story.includes('arrest') ? 'Arrest Rights & Custody' :
                                                item.story.includes('custody') ? 'Custody Welfare' :
                                                    'Legal Guide'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted">No legal guides available yet.</p>
                    )}
                </div>

                <div className="content-card">
                    <h2 className="flex items-center gap-sm mb-2">
                        <BookOpen size={18} className="text-primary" />
                        <span className="font-bold">PACE Codes of Practice</span>
                    </h2>
                    <p className="text-sm text-muted mb-3">Police And Criminal Evidence Act Codes A-I</p>
                    <span className="text-muted text-sm italic">Coming soon</span>
                </div>

                <div className="content-card">
                    <h2 className="flex items-center gap-sm mb-2">
                        <Gavel size={18} className="text-primary" />
                        <span className="font-bold">Key Legislation</span>
                    </h2>
                    <p className="text-sm text-muted mb-3">Public Order Act, Human Rights Act</p>
                    <span className="text-muted text-sm italic">Coming soon</span>
                </div>
            </div>
        </div>
    );
};

export default Law;
