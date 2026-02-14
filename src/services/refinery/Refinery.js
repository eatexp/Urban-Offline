/**
 * The Refinery — Just-in-Time HTML→Semantic Markdown Distillation
 *
 * Converts raw HTML (from ZIM files, Wikipedia, etc.) into structured
 * Semantic Markdown optimized for small local LLMs.
 *
 * Why: Raw HTML wastes ~60% of context tokens on tags, CSS, scripts,
 * and boilerplate. Flat plaintext (regex tag stripping) destroys structure.
 * Semantic Markdown preserves headers, lists, emphasis, and tables —
 * giving models structured reasoning input.
 *
 * Pipeline stages:
 *   1. stripBoilerplate  — Remove <script>, <style>, navboxes, edit links
 *   2. extractStructure  — Walk DOM, emit Markdown syntax
 *   3. compressWhitespace — Normalize blank lines and spacing
 *   4. truncateToTokenBudget — Section-aware truncation
 *
 * Usage:
 *   import { refine } from '../refinery/Refinery';
 *   const { markdown, meta } = refine(rawHTML, { tokenBudget: 800 });
 */

import { createLogger } from '../../utils/logger.js';

const log = createLogger('Refinery');

// Selectors for elements that are noise for LLMs
const BOILERPLATE_SELECTORS = [
    'script', 'style', 'link', 'meta', 'noscript',
    'nav', 'footer', 'header',
    '.navbox', '.navbox-inner', '.navbox-group',
    '.infobox', '.sidebar', '.mw-editsection',
    '.mw-jump-link', '.mw-indicators', '.mw-references-wrap',
    '.reflist', '.reference', '.mw-empty-elt',
    '.toc', '.catlinks', '.mw-authority-control',
    '.noprint', '.mbox-small', '.metadata',
    '.sistersitebox', '.portal', '.hatnote',
    '#coordinates', '#siteSub', '#contentSub',
    '[role="navigation"]', '[role="banner"]',
    '.thumb', // Often redundant images with captions that break flow
    '.gallery', // Image galleries often distract
    '.mw-parser-output > div.hatnote', // Disambiguation links
    '.shortdescription'
];

// ... (rest of file until _walkChildren)

/**
 * Walk all child nodes
 */
function _walkChildren(node, parts, state) {
    if (!node) return;

    // Handle specific parent-child relationships if needed
    // For lists, we might want to ensure proper spacing

    for (const child of node.childNodes) {
        _walkNode(child, parts, state);
    }
}

/**
 * Emit a Markdown heading
 */
function _emitHeading(node, parts, level) {
    const prefix = '#'.repeat(level);
    const text = node.textContent.trim();
    if (text) {
        parts.push(`\n\n${prefix} ${text}\n\n`);
    }
}

/**
 * Convert an HTML table to pipe-delimited Markdown
 */
function _emitTable(tableNode, parts) {
    const rows = tableNode.querySelectorAll('tr');
    if (rows.length === 0) return;

    parts.push('\n\n');

    let isFirstRow = true;
    for (const row of rows) {
        const cells = row.querySelectorAll('th, td');
        if (cells.length === 0) continue;

        const cellTexts = Array.from(cells).map(cell =>
            cell.textContent.replace(/\s+/g, ' ').trim()
        );

        parts.push('| ' + cellTexts.join(' | ') + ' |\n');

        // Add separator after first row (header)
        if (isFirstRow) {
            parts.push('| ' + cellTexts.map(() => '---').join(' | ') + ' |\n');
            isFirstRow = false;
        }
    }

    parts.push('\n');
}

/**
 * Stage 3: Compress whitespace — collapse excessive blank lines
 *
 * @param {string} markdown
 * @returns {string}
 */
export function compressWhitespace(markdown) {
    return markdown
        .replace(/\n{4,}/g, '\n\n\n')  // Max 2 consecutive blank lines
        .replace(/[ \t]+/g, ' ')        // Collapse horizontal whitespace
        .replace(/^ +/gm, '')           // Remove leading spaces on lines
        .trim();
}

/**
 * Stage 4: Truncate to a token budget, cutting at section boundaries
 *
 * @param {string} markdown
 * @param {number} tokenBudget — Approximate token limit
 * @returns {{ text: string, sections: string[] }}
 */
export function truncateToTokenBudget(markdown, tokenBudget) {
    const charBudget = tokenBudget * CHARS_PER_TOKEN;
    const sections = [];

    // Extract section headers
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = headerRegex.exec(markdown)) !== null) {
        sections.push(match[2].trim());
    }

    // If within budget, return as-is
    if (markdown.length <= charBudget) {
        return { text: markdown, sections };
    }

    // Cut at the nearest section boundary before the budget
    const lines = markdown.split('\n');
    let accumulated = 0;
    let cutIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
        accumulated += lines[i].length + 1; // +1 for newline
        if (accumulated > charBudget) {
            // Walk back to the nearest header or paragraph break
            for (let j = i; j >= Math.max(0, i - 10); j--) {
                if (lines[j].startsWith('#') || lines[j].trim() === '') {
                    cutIndex = j;
                    break;
                }
            }
            if (cutIndex === lines.length) cutIndex = i; // No good boundary found
            break;
        }
    }

    const truncated = lines.slice(0, cutIndex).join('\n').trim();

    // Filter sections to only those present in truncated output
    const keptSections = sections.filter(s => truncated.includes(s));

    return { text: truncated, sections: keptSections };
}

/**
 * Extract title from DOM
 */
function _extractTitle(doc) {
    // Try <title> first
    const titleEl = doc.querySelector('title');
    if (titleEl?.textContent?.trim()) {
        // Wikipedia titles often have " - Wikipedia" suffix
        return titleEl.textContent.trim().replace(/\s*[-–—]\s*Wikipedia.*$/i, '');
    }

    // Fall back to first <h1>
    const h1 = doc.querySelector('h1');
    if (h1?.textContent?.trim()) {
        return h1.textContent.trim();
    }

    return '';
}

/**
 * Return empty result shape
 */
function _emptyResult() {
    return {
        markdown: '',
        meta: {
            title: '',
            sections: [],
            charsBefore: 0,
            charsAfter: 0,
            compressionRatio: 0,
            refinedAt: Date.now()
        }
    };
}

// Approximate chars-per-token ratio for English text
const CHARS_PER_TOKEN = 4;

/**
 * Refine raw HTML into Semantic Markdown.
 *
 * @param {string} html — Raw HTML string
 * @param {Object} [options]
 * @param {number} [options.tokenBudget=800] — Max tokens in output
 * @returns {{ markdown: string, meta: Object }}
 */
export function refine(html, options = {}) {
    const { tokenBudget = 800 } = options;
    const startTime = performance.now();

    if (!html || typeof html !== 'string') {
        return _emptyResult();
    }

    const charsBefore = html.length;

    try {
        // Stage 1: Parse and strip boilerplate
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        stripBoilerplate(doc);

        // Extract title
        const title = _extractTitle(doc);

        // Stage 2: Walk DOM → Markdown
        const rawMarkdown = extractStructure(doc.body);

        // Stage 3: Compress whitespace
        const cleanMarkdown = compressWhitespace(rawMarkdown);

        // Stage 4: Truncate to token budget
        const { text: markdown, sections } = truncateToTokenBudget(cleanMarkdown, tokenBudget);

        const elapsed = performance.now() - startTime;
        const charsAfter = markdown.length;

        log.debug('Refined HTML→Markdown', {
            charsBefore,
            charsAfter,
            compressionRatio: (charsAfter / charsBefore).toFixed(3),
            sections: sections.length,
            elapsed: `${elapsed.toFixed(1)}ms`
        });

        return {
            markdown,
            meta: {
                title,
                sections,
                charsBefore,
                charsAfter,
                compressionRatio: charsBefore > 0 ? charsAfter / charsBefore : 0,
                refinedAt: Date.now()
            }
        };
    } catch (error) {
        log.warn('Refinery failed, falling back to plain text extraction', error);
        // Graceful degradation: crude strip as fallback
        const fallback = html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, tokenBudget * CHARS_PER_TOKEN);

        return {
            markdown: fallback,
            meta: {
                title: '',
                sections: [],
                charsBefore,
                charsAfter: fallback.length,
                compressionRatio: charsBefore > 0 ? fallback.length / charsBefore : 0,
                refinedAt: Date.now(),
                fallback: true,
                error: error.toString()
            }
        };
    }
}

/**
 * Stage 1: Strip boilerplate elements from the DOM
 * Removes scripts, styles, navigation, Wikipedia chrome, etc.
 *
 * @param {Document} doc
 */
export function stripBoilerplate(doc) {
    for (const selector of BOILERPLATE_SELECTORS) {
        try {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        } catch (_e) {
            // Invalid selector — skip silently
        }
    }
}

/**
 * Stage 2: Walk the DOM tree and emit Semantic Markdown
 *
 * @param {Element} root — Root element to walk
 * @returns {string} — Markdown text
 */
export function extractStructure(root) {
    if (!root) return '';

    const parts = [];
    _walkNode(root, parts, { depth: 0, inList: false, listType: null });
    return parts.join('');
}

/**
 * Recursive DOM walker that emits Markdown tokens
 */
function _walkNode(node, parts, state) {
    if (!node) return;

    // Text node → emit text
    if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const text = node.textContent.replace(/\s+/g, ' ');
        if (text.trim()) {
            parts.push(text);
        }
        return;
    }

    // Not an element → skip
    if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) return;

    const tag = node.tagName.toLowerCase();

    switch (tag) {
        // Headings
        case 'h1': _emitHeading(node, parts, 1); break;
        case 'h2': _emitHeading(node, parts, 2); break;
        case 'h3': _emitHeading(node, parts, 3); break;
        case 'h4': _emitHeading(node, parts, 4); break;
        case 'h5': _emitHeading(node, parts, 5); break;
        case 'h6': _emitHeading(node, parts, 6); break;

        // Paragraphs
        case 'p':
            parts.push('\n\n');
            _walkChildren(node, parts, state);
            parts.push('\n');
            break;

        // Inline emphasis
        case 'strong':
        case 'b':
            parts.push('**');
            _walkChildren(node, parts, state);
            parts.push('**');
            break;

        case 'em':
        case 'i':
            parts.push('*');
            _walkChildren(node, parts, state);
            parts.push('*');
            break;

        case 'code':
            parts.push('`');
            _walkChildren(node, parts, state);
            parts.push('`');
            break;

        // Links — keep text, drop href (reduces noise for LLMs)
        case 'a':
            _walkChildren(node, parts, state);
            break;

        // Line break
        case 'br':
            parts.push('\n');
            break;

        // Horizontal rule
        case 'hr':
            parts.push('\n\n---\n\n');
            break;

        // Lists
        case 'ul':
            parts.push('\n');
            _walkChildren(node, parts, { ...state, inList: true, listType: 'ul' });
            parts.push('\n');
            break;

        case 'ol':
            parts.push('\n');
            _walkChildren(node, parts, { ...state, inList: true, listType: 'ol', listIndex: 1 });
            parts.push('\n');
            break;

        case 'li': {
            const bullet = state.listType === 'ol' ? `${state.listIndex || 1}. ` : '- ';
            parts.push(bullet);
            _walkChildren(node, parts, state);
            parts.push('\n');
            if (state.listType === 'ol') state.listIndex = (state.listIndex || 1) + 1;
            break;
        }

        // Definition lists
        case 'dt':
            parts.push('\n**');
            _walkChildren(node, parts, state);
            parts.push('**\n');
            break;

        case 'dd':
            parts.push(': ');
            _walkChildren(node, parts, state);
            parts.push('\n');
            break;

        // Blockquotes
        case 'blockquote':
            parts.push('\n> ');
            _walkChildren(node, parts, state);
            parts.push('\n');
            break;

        // Preformatted / code blocks
        case 'pre':
            parts.push('\n```\n');
            parts.push(node.textContent);
            parts.push('\n```\n');
            break;

        // Tables → pipe-delimited Markdown
        case 'table':
            _emitTable(node, parts);
            break;

        // Skip <sup> reference numbers like [1], [2]
        case 'sup':
            if (node.classList?.contains('reference')) break;
            _walkChildren(node, parts, state);
            break;

        // Images — emit alt text only
        case 'img': {
            const alt = node.getAttribute('alt');
            if (alt && alt.trim()) {
                parts.push(`[Image: ${alt.trim()}]`);
            }
            break;
        }

        // Figures — extract caption
        case 'figure':
        case 'figcaption':
            _walkChildren(node, parts, state);
            break;

        // Generic block elements → just recurse
        case 'div':
        case 'section':
        case 'article':
        case 'main':
        case 'span':
        case 'small':
        case 'sub':
        case 'abbr':
        case 'time':
        case 'mark':
        case 'cite':
        case 'q':
        case 'var':
        case 'samp':
        case 'kbd':
        case 'dfn':
        case 'tbody':
        case 'thead':
        case 'tfoot':
        case 'dl':
            _walkChildren(node, parts, state);
            break;

        // Everything else — recurse (don't drop content)
        default:
            _walkChildren(node, parts, state);
            break;
    }
}

export default { refine };
