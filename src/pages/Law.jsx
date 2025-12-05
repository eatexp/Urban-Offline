import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, BookOpen, Gavel } from 'lucide-react';

const Law = () => {
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
