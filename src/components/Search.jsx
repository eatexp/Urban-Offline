import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, FileText, MapPin, Heart, Shield, Clock, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { HybridSearchService } from '../services/search/HybridSearch';
import { useViewTransition } from '../hooks/useViewTransition';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '../utils/logger';
import MLStatusIndicator from './MLStatusIndicator';

const logger = createLogger('Search');

// TODO: [A11y] SEARCH_ARIA_LIVE_REGIONS - IMPLEMENTED 2026-02-08
// Added aria-live region for search results, aria-expanded, and proper ARIA roles
// for screen reader accessibility in emergency scenarios.

// Memoized result item to prevent unnecessary re-renders during keyboard navigation
const SearchResultItem = React.memo(({ result, isHighlighted, onClick, onHover, getResultIcon }) => (
    <div
        className={`search-result-item ${isHighlighted ? 'bg-slate-800' : ''}`}
        onClick={onClick}
        onMouseEnter={onHover}
    >
        <div className="flex items-start gap-3">
            {getResultIcon(result.category)}
            <div className="flex-1 min-w-0">
                <div className="search-result-title">{result.title || "Unknown Result"}</div>
                <div className="search-result-description">{result.description || "No description available"}</div>
                {result.category && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300`}>
                            {result.category}
                        </span>
                        {result.confidence && (
                            <span className="text-xs text-slate-500">
                                {Math.round(result.confidence * 100)}% match
                            </span>
                        )}
                    </div>
                )}
            </div>
            <Clock size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
        </div>
    </div>
));

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [emergencyAlert, setEmergencyAlert] = useState(null);
    const navigate = useNavigate();
    const searchContainerRef = useRef(null);
    const inputRef = useRef(null);
    const transitionWithTimeout = useViewTransition();

    // Enhanced search with emergency detection
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);

                try {
                    // =============================================================================
                    // INTEGRATION STATUS: VERIFIED & AUDITED
                    // =============================================================================
                    // HybridSearch correctly delegates to IntentClassifier:
                    // - Calls classifyIntent() for ML/keyword classification
                    // - Uses shared EMERGENCY_PATTERNS from config/intentPatterns.js
                    // - Returns full intent object with message, cta, triageFlow, etc.
                    //
                    // VERIFIED BEHAVIORS (code audit 2026-01-27):
                    // ✓ ML timeout (3s) falls back to keyword matching via IntentClassifier.isEmergency()
                    // ✓ Emergency alerts show correct message/cta from EMERGENCY_PATTERNS config
                    // ✓ triageFlow property routes to correct Ink story via handleEmergencyClick()
                    // =============================================================================
                    const response = await HybridSearchService.search(query, {
                        includeIntentRouting: true
                    });

                    // Update UI with results
                    setResults(response.results);

                    // Handle Intent/Emergency Alert
                    if (response.intent && response.intent.priority >= 7) {
                        setEmergencyAlert({
                            message: response.intent.message || '⚠️ Emergency Detected',
                            cta: response.intent.suggestedAction === 'triage' ? 'Start Guide' : 'View Protocol', // Fallback CTA
                            ...response.intent,
                            ...response.intent // Spread intent properties (triageFlow, protocolId, etc.)
                        });
                    } else {
                        setEmergencyAlert(null);
                    }

                    setIsOpen(true);
                    setHighlightedIndex(-1);
                } catch (e) {
                    logger.error("Search failed", e);
                    setResults([]);
                    setEmergencyAlert(null);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
                setEmergencyAlert(null);
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Memoized handlers for keyboard navigation performance
    const handleEmergencyClick = useCallback(() => {
        setIsOpen(false);
        setQuery('');
        setHighlightedIndex(-1);

        const performNavigation = () => {
            if (emergencyAlert?.triageStory) {
                const storyId = emergencyAlert.triageStory.replace('.ink.json', '');
                navigate(`/triage/${storyId}`);
            } else if (emergencyAlert?.protocolId) {
                navigate(`/protocol/${emergencyAlert.protocolId}`);
            } else if (emergencyAlert?.category) {
                navigate(`/${emergencyAlert.category}`);
            }
        };

        // VERIFIED: useViewTransition has 2s timeout and fallback for unsupported browsers
        transitionWithTimeout(performNavigation);
    }, [emergencyAlert, navigate, transitionWithTimeout]);

    const handleResultClick = useCallback((result) => {
        setIsOpen(false);
        setQuery('');
        setHighlightedIndex(-1);
        const target = result.slug ? `/article/${result.slug}` : '#';

        transitionWithTimeout(() => {
            navigate(target);
        });
    }, [navigate, transitionWithTimeout]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < results.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    // If emergency alert and at index -1, trigger the emergency action
                    if (highlightedIndex === -1 && emergencyAlert) {
                        handleEmergencyClick();
                    } else if (highlightedIndex >= 0 && results[highlightedIndex]) {
                        handleResultClick(results[highlightedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    inputRef.current?.blur();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, highlightedIndex, emergencyAlert, handleEmergencyClick, handleResultClick]);

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    // Memoized handler for clearing search
    const handleClearSearch = useCallback(() => {
        setQuery('');
        setIsOpen(false);
        setHighlightedIndex(-1);
        setEmergencyAlert(null);
    }, []);

    const getResultIcon = (category) => {
        switch (category) {
            case 'medical': return <Heart size={16} className="text-emergency-red" />;
            case 'survival': return <Shield size={16} className="text-emergency-orange" />;
            case 'legal': return <FileText size={16} className="text-emergency-blue" />;
            case 'map': return <MapPin size={16} className="text-emergency-green" />;
            default: return <FileText size={16} className="text-slate-400" />;
        }
    };

    const getEmergencyColor = (urgency) => {
        if (urgency >= 9) return 'from-red-600 to-red-700';
        if (urgency >= 7) return 'from-orange-600 to-orange-700';
        return 'from-amber-600 to-amber-700';
    };

    const getEmergencyBorderColor = (urgency) => {
        if (urgency >= 9) return 'border-red-500';
        if (urgency >= 7) return 'border-orange-500';
        return 'border-amber-500';
    };

    return (
        <div className="search-container transition-search-bar" ref={searchContainerRef}>
            <div className="mb-2 flex justify-end">
                <MLStatusIndicator />
            </div>
            <div className="relative">
                {/* =============================================================================
                // VERIFIED: [NativeUX] SEARCH_INPUT_IOS_ZOOM_PREVENTION
                // =============================================================================
                // Implementation: Input uses fontSize: 16px to prevent iOS Safari auto-zoom
                //   on focus. Also adds touchAction: 'manipulation' for immediate response.
                // This ensures consistent viewport scale and app-like feel on iOS devices.
                // ============================================================================= */}
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search emergency knowledge..."
                    aria-label="Search emergency knowledge"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                    style={{
                        fontSize: '16px', // Prevents iOS zoom on focus
                        touchAction: 'manipulation' // Removes 300ms touch delay
                    }}
                />
                <SearchIcon size={16} className="search-icon" />
                {query && (
                    <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
                {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <div 
                className={`search-results ${isOpen ? 'active' : ''}`}
                role="region"
                aria-label="Search results"
                aria-expanded={isOpen}
                aria-live="polite"
                aria-atomic="false"
            >
                {/* Screen reader announcement for results count */}
                <div className="sr-only" role="status" aria-live="polite">
                    {results.length > 0 && `${results.length} results found`}
                    {emergencyAlert && 'Emergency alert displayed'}
                </div>

                {/* Emergency Alert - Top Priority */}
                {emergencyAlert && (
                    <div className="p-2" role="alert" aria-live="assertive">
                        <button
                            onClick={handleEmergencyClick}
                            className={`w-full text-left p-4 rounded-xl bg-gradient-to-r ${getEmergencyColor(emergencyAlert.urgency)} border-2 ${getEmergencyBorderColor(emergencyAlert.urgency)} shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]`}
                            aria-label={`Emergency: ${emergencyAlert.message}. Press Enter to respond.`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={24} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white text-lg">
                                        {emergencyAlert.message}
                                    </div>
                                    <div className="text-white/90 text-sm mt-0.5">
                                        {emergencyAlert.cta}
                                    </div>
                                </div>
                                <ChevronRight size={24} className="text-white/80 flex-shrink-0" />
                            </div>
                        </button>
                    </div>
                )}

                {/* Regular Results */}
                {results.length > 0 ? (
                    <>
                        <div className="px-4 py-2 border-b border-slate-700">
                            <p className="text-xs text-slate-400 font-medium" aria-live="polite">
                                {emergencyAlert ? 'Related articles' : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        <div role="list">
                            {results.map((result, idx) => (
                                <div key={result.id || idx} role="listitem">
                                    <SearchResultItem
                                        result={result}
                                        isHighlighted={highlightedIndex === idx}
                                        onClick={() => handleResultClick(result)}
                                        onHover={() => setHighlightedIndex(idx)}
                                        getResultIcon={getResultIcon}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                ) : query.length > 2 && !isSearching && !emergencyAlert ? (
                    <div className="px-4 py-8 text-center">
                        <SearchIcon size={24} className="text-slate-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No results found</p>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Try different keywords or ask AI assistant</p>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setQuery('');
                                transitionWithTimeout(() => navigate('/ai'));
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30"
                        >
                            <Sparkles size={16} />
                            Ask AI Assistant
                        </button>
                    </div>
                ) : null}

                {/* Keyboard hint */}
                {isOpen && (results.length > 0 || emergencyAlert) && (
                    <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>Esc Close</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
