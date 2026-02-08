import React from 'react';

// Format cache to prevent re-parsing on every render
const formatCache = new Map();
const MAX_FORMAT_CACHE_SIZE = 100;

/**
 * Simple markdown-like formatting with caching
 * Handles bold, bullet points, and numbered lists.
 */
export function formatContent(content, isUser = false) {
    if (!content) return null;

    const cacheKey = `${content}|${isUser}`;
    if (formatCache.has(cacheKey)) {
        return formatCache.get(cacheKey);
    }

    // Split by lines and process
    const lines = content.split('\n');

    const result = lines.map((line, i) => {
        // Bold text
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
            }
            parts.push(
                <strong
                    key={`bold-${i}-${match.index}`}
                    style={{ color: isUser ? 'white' : 'var(--color-text-primary)' }}
                >
                    {match[1]}
                </strong>
            );
            lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }

        // Handle bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
                <div key={i} className="flex gap-2 ml-2">
                    <span>•</span>
                    <span>{parts.length > 0 ? parts : line.substring(2)}</span>
                </div>
            );
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(line)) {
            return (
                <div key={i} className="flex gap-2 ml-2">
                    <span className="font-medium">{line.match(/^\d+\./)[0]}</span>
                    <span>{line.replace(/^\d+\.\s/, '')}</span>
                </div>
            );
        }

        return (
            <React.Fragment key={i}>
                {parts.length > 0 ? parts : line}
                {i < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });

    // LRU eviction for format cache
    if (formatCache.size >= MAX_FORMAT_CACHE_SIZE) {
        const firstKey = formatCache.keys().next().value;
        formatCache.delete(firstKey);
    }
    formatCache.set(cacheKey, result);

    return result;
}
