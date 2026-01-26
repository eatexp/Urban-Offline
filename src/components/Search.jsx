import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, FileText, MapPin, Heart, Shield, Clock, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { HybridSearchService } from '../services/search/HybridSearch';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '../utils/logger';

const logger = createLogger('Search');

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

    // Enhanced search with emergency detection
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);

                try {
                    // Use Hybrid Search for unified intent + results
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
                        // Mapper to match the expected alert shape if needed, 
                        // but IntentClassifier/HybridSearch result shape should be compatible.
                        // Let's verify HybridSearch returns the full intent object from IntentClassifier. 
                        // HybridSearch returns: { id, category, priority, suggestedAction, triageFlow, protocolId, score }
                        // It doesn't currently return 'message' or 'cta' in the mapped object in detectIntent.
                        // I need to fix HybridSearch.detectIntent to pass those through!
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
    }, [isOpen, results, highlightedIndex, emergencyAlert]);

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

    const handleEmergencyClick = () => {
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

        if (document.startViewTransition) {
            // TODO: Critical Robustness - Add timeout or error handling for view transitions if they hang
            // View transitions can fail or hang in some browsers, blocking navigation
            document.startViewTransition(() => {
                performNavigation();
            });
        } else {
            performNavigation();
        }
    };

    const handleResultClick = (result) => {
        setIsOpen(false);
        setQuery('');
        setHighlightedIndex(-1);
        const target = result.slug ? `/article/${result.slug}` : '#';

        if (target.startsWith('/triage') && document.startViewTransition) {
            // Add timeout handling for view transitions to prevent hanging
            const transitionTimeout = setTimeout(() => {
                log.warn('View transition timed out for result navigation, performing directly');
                navigate(target);
            }, 3000); // 3 second timeout

            document.startViewTransition(() => {
                clearTimeout(transitionTimeout);
                navigate(target);
            }).catch((err) => {
                clearTimeout(transitionTimeout);
                log.error('View transition failed for result navigation', err);
                navigate(target); // Fallback to direct navigation
            });
        } else {
            navigate(target);
        }
    };

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
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search emergency knowledge..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                />
                <SearchIcon size={16} className="search-icon" />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                            setHighlightedIndex(-1);
                            setEmergencyAlert(null);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
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

            <div className={`search-results ${isOpen ? 'active' : ''}`}>
                {/* Emergency Alert - Top Priority */}
                {emergencyAlert && (
                    <div className="p-2">
                        <button
                            onClick={handleEmergencyClick}
                            className={`w-full text-left p-4 rounded-xl bg-gradient-to-r ${getEmergencyColor(emergencyAlert.urgency)} border-2 ${getEmergencyBorderColor(emergencyAlert.urgency)} shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]`}
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
                            <p className="text-xs text-slate-400 font-medium">
                                {emergencyAlert ? 'Related articles' : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        {results.map((result, idx) => (
                            <div
                                key={result.id || idx}
                                className={`search-result-item ${highlightedIndex === idx ? 'bg-slate-800' : ''}`}
                                onClick={() => handleResultClick(result)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
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
                        ))}
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
                                if (document.startViewTransition) {
                                    document.startViewTransition(() => navigate('/ai'));
                                } else {
                                    navigate('/ai');
                                }
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
