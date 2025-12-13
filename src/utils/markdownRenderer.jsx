import React from 'react';

/**
 * Lightweight Markdown Renderer for Triage Guides
 * Supports: bold, italic, headings, lists, links, code, blockquotes
 *
 * Optimized for offline emergency use - no external dependencies
 */

// Parse inline markdown (bold, italic, code, links)
const parseInline = (text, key = 0) => {
    if (!text) return null;

    const elements = [];
    let remaining = text;
    let index = 0;

    // Regex patterns for inline elements
    const patterns = [
        // Bold **text** or __text__
        { regex: /\*\*(.+?)\*\*|__(.+?)__/g, render: (match, p1, p2) => <strong key={`b-${index++}`} className="font-bold">{p1 || p2}</strong> },
        // Italic *text* or _text_ (but not inside bold)
        { regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, render: (match, p1, p2) => <em key={`i-${index++}`} className="italic">{p1 || p2}</em> },
        // Inline code `code`
        { regex: /`([^`]+)`/g, render: (match, p1) => <code key={`c-${index++}`} className="px-1 py-0.5 bg-slate-200 text-slate-800 rounded text-sm font-mono">{p1}</code> },
        // Links [text](url)
        { regex: /\[([^\]]+)\]\(([^)]+)\)/g, render: (match, text, url) => <a key={`a-${index++}`} href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{text}</a> },
    ];

    // Process patterns in order
    let result = text;

    // First handle bold (to avoid conflicts with italic)
    result = result.replace(/\*\*(.+?)\*\*/g, '<<<BOLD:$1>>>');
    result = result.replace(/__(.+?)__/g, '<<<BOLD:$1>>>');

    // Then italic
    result = result.replace(/(?<![<*])\*([^*]+)\*(?![>*])/g, '<<<ITALIC:$1>>>');
    result = result.replace(/(?<![<_])_([^_]+)_(?![>_])/g, '<<<ITALIC:$1>>>');

    // Inline code
    result = result.replace(/`([^`]+)`/g, '<<<CODE:$1>>>');

    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<<<LINK:$1|$2>>>');

    // Split and render
    const parts = result.split(/(<<<[A-Z]+:[^>]+>>>)/g);

    return parts.map((part, i) => {
        if (part.startsWith('<<<BOLD:')) {
            const content = part.slice(8, -3);
            return <strong key={`${key}-b-${i}`} className="font-bold">{content}</strong>;
        }
        if (part.startsWith('<<<ITALIC:')) {
            const content = part.slice(10, -3);
            return <em key={`${key}-i-${i}`} className="italic">{content}</em>;
        }
        if (part.startsWith('<<<CODE:')) {
            const content = part.slice(8, -3);
            return <code key={`${key}-c-${i}`} className="px-1 py-0.5 bg-slate-200 text-slate-800 rounded text-sm font-mono">{content}</code>;
        }
        if (part.startsWith('<<<LINK:')) {
            const content = part.slice(8, -3);
            const [text, url] = content.split('|');
            return <a key={`${key}-a-${i}`} href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{text}</a>;
        }
        return part;
    });
};

// Parse a single line and return the appropriate element
const parseLine = (line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
        return null;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        const HeadingTag = `h${level}`;
        const sizeClass = {
            1: 'text-2xl font-bold mb-4',
            2: 'text-xl font-bold mb-3',
            3: 'text-lg font-bold mb-2',
            4: 'text-base font-bold mb-2',
            5: 'text-sm font-bold mb-1',
            6: 'text-xs font-bold mb-1',
        }[level];

        return (
            <HeadingTag key={index} className={`${sizeClass} text-slate-900`}>
                {parseInline(content, index)}
            </HeadingTag>
        );
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
        const content = trimmed.slice(1).trim();
        return (
            <blockquote key={index} className="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-blue-50 text-slate-700 italic">
                {parseInline(content, index)}
            </blockquote>
        );
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
        return <hr key={index} className="my-4 border-slate-300" />;
    }

    // Regular paragraph
    return (
        <p key={index} className="text-lg leading-relaxed text-slate-800 mb-3">
            {parseInline(trimmed, index)}
        </p>
    );
};

// Parse list items and group them
const parseListItems = (lines) => {
    const elements = [];
    let currentList = null;
    let currentListType = null;
    let lineIndex = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        // Unordered list item
        const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (unorderedMatch) {
            if (currentListType !== 'ul') {
                if (currentList) {
                    elements.push(currentList);
                }
                currentList = { type: 'ul', items: [], startIndex: lineIndex };
                currentListType = 'ul';
            }
            currentList.items.push(unorderedMatch[1]);
            lineIndex++;
            continue;
        }

        // Ordered list item
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (orderedMatch) {
            if (currentListType !== 'ol') {
                if (currentList) {
                    elements.push(currentList);
                }
                currentList = { type: 'ol', items: [], startIndex: lineIndex };
                currentListType = 'ol';
            }
            currentList.items.push(orderedMatch[2]);
            lineIndex++;
            continue;
        }

        // Not a list item - close current list and add line
        if (currentList) {
            elements.push(currentList);
            currentList = null;
            currentListType = null;
        }
        elements.push({ type: 'line', content: line, index: lineIndex });
        lineIndex++;
    }

    // Don't forget the last list
    if (currentList) {
        elements.push(currentList);
    }

    return elements;
};

/**
 * Render markdown text to React elements
 * @param {string} text - The markdown text to render
 * @returns {React.ReactNode[]} Array of React elements
 */
export const renderMarkdown = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const parsed = parseListItems(lines);

    return parsed.map((item, idx) => {
        if (item.type === 'ul') {
            return (
                <ul key={`ul-${idx}`} className="list-disc list-inside space-y-1 my-3 text-slate-800">
                    {item.items.map((listItem, liIdx) => (
                        <li key={`li-${idx}-${liIdx}`} className="text-lg leading-relaxed">
                            {parseInline(listItem, `${idx}-${liIdx}`)}
                        </li>
                    ))}
                </ul>
            );
        }

        if (item.type === 'ol') {
            return (
                <ol key={`ol-${idx}`} className="list-decimal list-inside space-y-1 my-3 text-slate-800">
                    {item.items.map((listItem, liIdx) => (
                        <li key={`li-${idx}-${liIdx}`} className="text-lg leading-relaxed">
                            {parseInline(listItem, `${idx}-${liIdx}`)}
                        </li>
                    ))}
                </ol>
            );
        }

        return parseLine(item.content, item.index);
    }).filter(Boolean);
};

/**
 * MarkdownText component for easy usage
 */
export const MarkdownText = ({ children, className = '' }) => {
    if (!children) return null;

    return (
        <div className={`markdown-content ${className}`}>
            {renderMarkdown(children)}
        </div>
    );
};

export default MarkdownText;
