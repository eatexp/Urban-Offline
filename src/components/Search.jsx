import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { SearchService } from '../services/SearchService';
import { useNavigate } from 'react-router-dom';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const listId = 'search-results-list';

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                try {
                    const searchResults = await SearchService.search(query);
                    setResults(searchResults);
                    setIsOpen(true);
                    setSelectedIndex(-1); // Reset selection on new results
                } catch (e) {
                    console.error("Search failed", e);
                    setResults([]);
                }
            } else {
                setResults([]);
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleResultClick = useCallback((result) => {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(-1);
        // Navigate to article using slug
        const target = result.slug ? `/article/${result.slug}` : '#';
        navigate(target);
    }, [navigate]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen || results.length === 0) {
            // Allow Escape to clear even without results
            if (e.key === 'Escape') {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.blur();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : results.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleResultClick(results[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
            case 'Tab':
                // Allow tab to close dropdown
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    }, [isOpen, results, selectedIndex, handleResultClick]);

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && resultsRef.current) {
            const selectedElement = resultsRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full max-w-xs ml-auto mr-4">
            <div className="relative">
                <label htmlFor="search-input" className="sr-only">
                    Search offline content
                </label>
                <input
                    ref={inputRef}
                    id="search-input"
                    type="text"
                    className="w-full pl-8 pr-8 py-1 text-sm rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                    placeholder="Search offline..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
                />
                <SearchIcon
                    size={14}
                    className="absolute left-2.5 top-2 text-slate-400"
                    aria-hidden="true"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                        aria-label="Clear search"
                        type="button"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <ul
                    ref={resultsRef}
                    id={listId}
                    role="listbox"
                    aria-label="Search results"
                    className="absolute top-full right-0 w-64 bg-slate-900 border border-slate-700 rounded shadow-xl mt-1 z-50 max-h-60 overflow-y-auto"
                >
                    {results.map((res, idx) => (
                        <li
                            key={idx}
                            id={`search-result-${idx}`}
                            role="option"
                            aria-selected={idx === selectedIndex}
                            className={`p-2 cursor-pointer text-sm border-b border-slate-800 last:border-0 ${
                                idx === selectedIndex
                                    ? 'bg-slate-700'
                                    : 'hover:bg-slate-800'
                            }`}
                            onClick={() => handleResultClick(res)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                        >
                            <div className="font-semibold text-white">{res.title || "Unknown Result"}</div>
                            <div className="text-xs text-slate-400 truncate">{res.description || "No description"}</div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && query.length > 2 && results.length === 0 && (
                <div
                    className="absolute top-full right-0 w-64 bg-slate-900 border border-slate-700 rounded shadow-xl mt-1 z-50 p-3 text-center text-sm text-slate-400"
                    role="status"
                    aria-live="polite"
                >
                    No results found
                </div>
            )}
        </div>
    );
};

export default Search;
