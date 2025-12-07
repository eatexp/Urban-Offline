import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, BookOpen, Gavel, Shield } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';

const Law = () => {
    const legalStories = TriageRouter.getStoriesByCategory('legal');

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <Scale className="w-8 h-8" />
                Law & Rights
            </h1>
            <p className="text-gray-600">
                Offline access to UK legislation, PACE codes, and your rights.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Interactive Triage Section */}
                <div className="bg-white p-4 rounded-lg shadow border border-blue-200 col-span-1 md:col-span-2">
                    <h2 className="font-semibold text-lg flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Interactive Legal Guides
                    </h2>
                    <div className="grid gap-2">
                        {legalStories.map((item, index) => (
                            <Link
                                key={index}
                                to={`/triage/${item.story}`}
                                className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors border border-blue-100"
                            >
                                <span className="font-medium text-blue-800">
                                    {item.story.includes('stop-and-search') ? 'Stop & Search (GOWISELY)' :
                                        item.story.includes('arrest') ? 'Arrest Rights & Custody' :
                                            item.story.includes('custody') ? 'Custody Welfare' :
                                                'Legal Guide'}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        PACE Codes of Practice
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">Police And Criminal Evidence Act Codes A-I</p>
                    <Link to="/guides/pace-codes" className="text-blue-600 font-medium hover:underline">
                        Browse Codes
                    </Link>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-blue-500" />
                        Key Legislation
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">Public Order Act, Human Rights Act</p>
                    <Link to="/guides/legislation" className="text-blue-600 font-medium hover:underline">
                        View Acts
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Law;
