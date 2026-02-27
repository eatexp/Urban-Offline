import React from 'react';

const SkeletonPage = () => {
    return (
        <div className="animate-pulse space-y-6">
            {/* Hero Card Skeleton */}
            <div className="h-48 bg-slate-800 rounded-2xl w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-shimmer" style={{ backgroundSize: '1000px 100%' }}></div>
            </div>

            {/* AI Assistant Card Skeleton */}
            <div className="h-24 bg-slate-800 rounded-2xl w-full"></div>

            {/* Grid Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-4 w-32 bg-slate-800 rounded"></div>
                    <div className="h-px flex-1 bg-slate-800"></div>
                </div>
                <div className="grid gap-4">
                    <div className="h-20 bg-slate-800 rounded-2xl"></div>
                    <div className="h-20 bg-slate-800 rounded-2xl"></div>
                    <div className="h-20 bg-slate-800 rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonPage;
