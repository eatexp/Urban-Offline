/* eslint-disable react-refresh/only-export-components -- Context + hook must coexist in this file */
/**
 * AIGeneratingContext.jsx — Cross-page AI streaming signal
 *
 * Lightweight React Context that carries `isGenerating` from AIChat
 * to any component on any page (e.g. Cartridge in DatasetManager).
 * When AIChat is streaming, mounted Cartridges pulse/glow.
 *
 * Zero overhead when idle — the context value only changes on
 * stream start/stop, not per-token.
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const AIGeneratingContext = createContext({
    isGenerating: false,
    setIsGenerating: () => { },
});

export function useAIGenerating() {
    return useContext(AIGeneratingContext);
}

export function AIGeneratingProvider({ children }) {
    const [isGenerating, setIsGeneratingRaw] = useState(false);

    // Stable setter — prevents unnecessary re-renders
    const setIsGenerating = useCallback((val) => {
        setIsGeneratingRaw(val);
    }, []);

    const value = useMemo(
        () => ({ isGenerating, setIsGenerating }),
        [isGenerating, setIsGenerating]
    );

    return (
        <AIGeneratingContext.Provider value={value}>
            {children}
        </AIGeneratingContext.Provider>
    );
}

export default AIGeneratingContext;
