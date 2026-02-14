import React, { useMemo } from 'react';
import { MessageSquare, Trash2, Plus, Clock, ChevronRight } from 'lucide-react';

/**
 * SessionList — "Mission Logs" Sidebar
 * Groups sessions by "Today", "Yesterday", "Older".
 */
const SessionList = ({ sessions, activeSessionId, onSelect, onDelete, onNew }) => {

    // Group sessions by date
    const groupedSessions = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            older: []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - (24 * 60 * 60 * 1000);

        sessions.forEach(session => {
            const date = new Date(session.updatedAt || session.createdAt).getTime();
            if (date >= today) {
                groups.today.push(session);
            } else if (date >= yesterday) {
                groups.yesterday.push(session);
            } else {
                groups.older.push(session);
            }
        });

        return groups;
    }, [sessions]);

    const renderGroup = (title, list) => {
        if (list.length === 0) return null;
        return (
            <div className="mb-6 animate-fade-in">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                    {title}
                </h3>
                <div className="space-y-1">
                    {list.map(session => (
                        <div
                            key={session.id}
                            className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${activeSessionId === session.id
                                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-gray-400'
                                }`}
                            onClick={() => onSelect(session.id)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSessionId === session.id ? 'text-primary-400' : 'text-gray-600'
                                    }`} />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate pr-4">
                                        {session.title || 'Untitled Mission'}
                                    </span>
                                    <span className="text-xs text-gray-600 truncate">
                                        {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Delete Action (visible on hover or active) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(session.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-all"
                                title="Delete Mission Log"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Active Indicator */}
                            {activeSessionId === session.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border-r border-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90 font-semibold">
                    <Clock className="w-4 h-4 text-primary-400" />
                    <span>Mission Logs</span>
                </div>
                <button
                    onClick={onNew}
                    className="p-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                    title="New Mission"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {renderGroup('Today', groupedSessions.today)}
                {renderGroup('Yesterday', groupedSessions.yesterday)}
                {renderGroup('Older', groupedSessions.older)}

                {sessions.length === 0 && (
                    <div className="text-center py-10 text-gray-600">
                        <p className="text-sm">No mission logs found.</p>
                        <button
                            onClick={onNew}
                            className="mt-4 text-primary-400 text-xs hover:underline"
                        >
                            Start a new mission
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionList;
