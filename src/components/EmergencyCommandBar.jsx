/**
 * EmergencyCommandBar - Hero search component for rapid emergency access
 * 
 * Features:
 * - Large, high-contrast search input for emergency queries
 * - One-touch critical action buttons (CPR, Choking, Bleeding)
 * - As-you-type emergency detection using TriageRouter
 * - Direct navigation to triage stories
 * - Keyboard accessible with haptic feedback
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Wind, Droplets, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { TriageRouter } from '../services/triage/TriageRouter';
import { TRIAGE_STORIES } from '../config/intentPatterns';

// TODO: [A11y] EMERGENCY_COMMAND_BAR_ACCESSIBILITY - IMPLEMENTED 2026-02-08
// Added role="search", aria-live regions, and keyboard shortcut (Ctrl/Cmd+Shift+E)
// for screen reader accessibility of critical emergency features.

// Critical emergencies for one-touch access (highest urgency stories)
const CRITICAL_ACTIONS = [
    {
        key: 'health_cpr',
        label: 'CPR',
        icon: Heart,
        route: '/triage/health/cpr.ink.json',
        color: 'var(--color-danger)',
        bgColor: 'rgba(239, 68, 68, 0.15)'
    },
    {
        key: 'health_choking',
        label: 'Choking',
        icon: Wind,
        route: '/triage/health/choking.ink.json',
        color: 'var(--color-warning)',
        bgColor: 'rgba(245, 158, 11, 0.15)'
    },
    {
        key: 'health_severe_bleeding',
        label: 'Bleeding',
        icon: Droplets,
        route: '/triage/health/severe-bleeding.ink.json',
        color: 'var(--color-danger)',
        bgColor: 'rgba(239, 68, 68, 0.15)'
    }
];

const EmergencyCommandBar = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Haptic feedback imported from shared utility

    // Navigate to triage story - MOVED BEFORE handleKeyDown to fix hoisting issue
    const handleSuggestionClick = useCallback((suggestion) => {
        triggerHaptic('heavy');
        setQuery('');
        setSuggestions([]);
        navigate(`/triage/${suggestion.story}`, {
            state: { urgency: suggestion.urgency }
        });
    }, [navigate]);

    // Keyboard shortcut to focus emergency search (Ctrl/Cmd+Shift+E)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                inputRef.current?.focus();
                // Announce to screen readers
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('emergency-command-focused'));
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search for matching triage stories as user types
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        const input = query.toLowerCase();
        const matches = [];

        // Search through all triage stories
        for (const [key, story] of Object.entries(TRIAGE_STORIES)) {
            if (!story.triageStory) continue;

            const keywordMatches = story.keywords.filter(kw =>
                input.includes(kw.toLowerCase()) || kw.toLowerCase().includes(input)
            );

            if (keywordMatches.length > 0 || story.title?.toLowerCase().includes(input)) {
                matches.push({
                    key,
                    story: story.triageStory,
                    title: story.title,
                    description: story.description,
                    urgency: story.urgency,
                    category: story.category,
                    score: keywordMatches.length * story.urgency
                });
            }
        }

        // Sort by score (urgency * keyword matches) descending
        matches.sort((a, b) => b.score - a.score);
        setSuggestions(matches.slice(0, 5));
        setHighlightedIndex(-1);
    }, [query]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    handleSuggestionClick(suggestions[highlightedIndex]);
                } else if (suggestions.length > 0) {
                    handleSuggestionClick(suggestions[0]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setQuery('');
                setSuggestions([]);
                inputRef.current?.blur();
                break;
        }
    }, [suggestions, highlightedIndex]);

    // Navigate to triage story


    // Handle critical action button click
    const handleCriticalAction = useCallback((action) => {
        triggerHaptic('heavy');
        navigate(action.route, {
            state: { urgency: TRIAGE_STORIES[action.key]?.urgency || 10 }
        });
    }, [navigate, triggerHaptic]);

    const getUrgencyColor = (urgency) => {
        if (urgency >= 9) return 'from-red-600 to-red-700';
        if (urgency >= 7) return 'from-orange-600 to-orange-700';
        return 'from-amber-600 to-amber-700';
    };

    const showSuggestions = isFocused && suggestions.length > 0;

    return (
        <div 
            className="emergency-command-bar animate-scale-in" 
            role="search" 
            aria-label="Emergency quick access"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-hidden="true"></div>
                <span className="text-sm font-bold uppercase tracking-wide text-red-400">
                    Emergency Access
                </span>
                <span className="sr-only">Press Ctrl+Shift+E to focus emergency search</span>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
                <input
                    ref={inputRef}
                    type="text"
                    className="emergency-search-input"
                    placeholder="What's happening? (e.g., 'not breathing', 'choking')"
                    aria-label="Emergency search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    style={{
                        fontSize: '16px', // Prevents iOS zoom
                        touchAction: 'manipulation'
                    }}
                />
                <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Screen reader announcements */}
                <div className="sr-only" role="status" aria-live="polite">
                    {suggestions.length > 0 && `${suggestions.length} emergency guides found`}
                    {query.length >= 2 && suggestions.length === 0 && 'No matching emergency guides found'}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                    <div 
                        className="emergency-suggestions"
                        role="listbox"
                        aria-label="Emergency guide suggestions"
                    >
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion.key}
                                role="option"
                                aria-selected={highlightedIndex === index}
                                className={`emergency-suggestion-item ${highlightedIndex === index ? 'highlighted' : ''
                                    }`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <div className={`suggestion-urgency bg-gradient-to-r ${getUrgencyColor(suggestion.urgency)}`}>
                                    <AlertTriangle size={16} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-semibold text-white truncate">
                                        {suggestion.title}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate">
                                        {suggestion.description}
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-500" />
                            </button>
                        ))}
                        <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">
                            ↑↓ Navigate • Enter Select • Esc Close
                        </div>
                    </div>
                )}
            </div>

            {/* One-Touch Critical Actions */}
            <div className="grid grid-cols-3 gap-3" role="group" aria-label="Critical emergency actions">
                {CRITICAL_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.key}
                            onClick={() => handleCriticalAction(action)}
                            className="critical-action-btn"
                            aria-label={`${action.label} emergency guide`}
                            style={{
                                '--action-color': action.color,
                                '--action-bg': action.bgColor
                            }}
                        >
                            <div className="critical-action-icon" aria-hidden="true">
                                <Icon size={24} />
                            </div>
                            <span className="critical-action-label">{action.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Hint */}
            <p className="text-xs text-center text-slate-500 mt-4">
                Type a symptom or tap a button for instant guidance
            </p>
        </div>
    );
};

export default EmergencyCommandBar;
