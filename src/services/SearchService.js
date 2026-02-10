import { Capacitor } from '@capacitor/core';
import { SearchService as WebSearch } from './search/WebSearch';
import { NativeSearch } from './search/NativeSearch';

const isNative = Capacitor.isNativePlatform();

// =============================================================================
// VERIFIED: [P3][Consistency] SEARCH_SERVICE_UNIFICATION
// Implementation: Both WebSearch and NativeSearch implement the same interface.
//   Platform-appropriate implementation is selected at runtime.
//   Ensures consistent search UX across web and native platforms.
// =============================================================================

/**
 * Search Service Interface
 * 
 * Both WebSearch (FlexSearch-based) and NativeSearch (SQLite FTS5-based)
 * implement this common interface for platform-consistent search functionality.
 * 
 * @typedef {Object} SearchServiceInterface
 * @property {function(): Promise<void>} init - Initialize the search index/connection
 * @property {function(Object): Promise<void>} addDocument - Add a single document to the index
 * @property {function(Array<Object>): Promise<void>} addDocuments - Add multiple documents to the index
 * @property {function(string): Promise<Array<SearchResult>>} search - Execute search query
 * 
 * @typedef {Object} SearchResult
 * @property {string} id - Unique document identifier
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Document title
 * @property {string} description - Short description or snippet
 * @property {string} category - Content category (e.g., 'health', 'survival', 'law')
 * 
 * Document Schema (for addDocument/addDocuments):
 * @typedef {Object} SearchDocument
 * @property {string} id - Unique document identifier
 * @property {string} [slug] - URL-friendly identifier (defaults to id)
 * @property {string} title - Document title
 * @property {string} content - Full searchable content
 * @property {string} [description] - Short description
 * @property {string} category - Content category
 * @property {string} [source] - Content source identifier
 * 
 * Behavior Standards:
 * - Search returns maximum 20 results
 * - Results ordered by relevance (rank/score)
 * - Supports prefix matching (e.g., "first" matches "first aid")
 * - Categories preserved for UI filtering/display
 */

export const SearchService = isNative ? NativeSearch : WebSearch;
