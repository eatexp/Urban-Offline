import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { SearchService } from '../services/SearchService';
import { useNavigate } from 'react-router-dom';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                try {
                    const searchResults = await SearchService.search(query);
                    setResults(searchResults);
                    setIsOpen(true);
                } catch (e) {
                    console.error("Search failed", e);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleResultClick = (result) => {
        setIsOpen(false);
        setQuery('');
        // Navigate to article using slug
        const target = result.slug ? `/article/${result.slug}` : '#';
        navigate(target);
    };

    return (
        <div className="relative w-full max-w-xs ml-auto mr-4">
            <div className="relative">
                <input
                    type="text"
                    className="w-full pl-8 pr-4 py-1 text-sm rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                    placeholder="Search offline..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <SearchIcon size={14} className="absolute left-2.5 top-2 text-slate-400" />
                {query && (
                    <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute right-2 top-1.5 text-slate-400 hover:text-white">
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full right-0 w-64 bg-slate-900 border border-slate-700 rounded shadow-xl mt-1 z-50 max-h-60 overflow-y-auto">
                    {results.map((res, idx) => (
                        <div
                            key={idx}
                            className="p-2 hover:bg-slate-800 cursor-pointer text-sm border-b border-slate-800 last:border-0"
                            onClick={() => handleResultClick(res)}
                        >
                            <div className="font-semibold text-white">{res.title || "Unknown Result"}</div>
                            <div className="text-xs text-slate-400 truncate">{res.description || "No description"}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Search;
