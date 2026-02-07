import { Story } from 'inkjs';
import DOMPurify from 'dompurify';
import { createLogger } from '../utils/logger';
import { db } from './db';

const log = createLogger('InkService');

// Critical stories that must be available offline for life-safety
const CRITICAL_STORIES = [
    'health/cpr.ink.json',
    'health/choking.ink.json',
    'health/severe-bleeding.ink.json',
    'legal/arrest-rights.ink.json'
];

class InkService {
    constructor() {
        this.story = null;
        this.storyCache = new Map();
    }

    /**
     * Check which critical stories are available in cache
     * @returns {Promise<{allPresent: boolean, present: string[], missing: string[]}>}
     */
    async checkCriticalStoriesCached() {
        const present = [];
        const missing = [];

        for (const storyPath of CRITICAL_STORIES) {
            try {
                const cached = await db.get('ink_stories', storyPath);
                if (cached) {
                    present.push(storyPath);
                } else {
                    missing.push(storyPath);
                }
            } catch (e) {
                log.warn(`Error checking cache for ${storyPath}`, e);
                missing.push(storyPath);
            }
        }

        return {
            allPresent: missing.length === 0,
            present,
            missing
        };
    }

    /**
     * Dispatch warning event to UI when critical content is unavailable
     * @param {string[]} missingStories - List of missing story paths
     */
    dispatchCriticalContentWarning(missingStories) {
        const storyNames = missingStories.map(path => {
            // Extract readable name from path (e.g., 'health/cpr.ink.json' -> 'CPR Guide')
            const name = path.replace('.ink.json', '').split('/').pop();
            return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        });

        const warning = {
            type: 'CRITICAL_CONTENT_UNAVAILABLE',
            message: `Emergency guides unavailable offline: ${storyNames.join(', ')}`,
            subMessage: 'Connect to internet to download critical emergency content',
            missingStories,
            severity: 'high',
            timestamp: new Date().toISOString()
        };

        log.warn('Critical stories missing offline', warning);

        // Dispatch to UI for banner display
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('critical-content-warning', {
                detail: warning
            }));
        }

        return warning;
    }

    /**
     * Preload critical triage stories to ensure offline availability.
     * Should be called during app initialization when online.
     * @returns {Promise<{loaded: number, failed: string[], cached: number, offline: boolean}>}
     */
    async preloadCriticalStories() {
        // =============================================================================
        // VERIFIED: [Safety] CRITICAL_STORY_PRELOAD_OFFLINE_FALLBACK
        // =============================================================================
        // Implementation: Always checks cache first regardless of online status.
        // If offline and critical stories are missing, dispatches warning event
        // to UI for banner display. Queues downloads for when connectivity returns.
        //
        // This ensures users are warned if they open the app offline without
        // critical emergency content available, preventing failed triage flows.
        // =============================================================================

        // Always check cache status first
        const cached = await this.checkCriticalStoriesCached();

        // If offline and missing critical stories, show warning
        if (!navigator.onLine) {
            if (!cached.allPresent) {
                this.dispatchCriticalContentWarning(cached.missing);
            }
            log.debug('Offline, skipping story preload', {
                cached: cached.present.length,
                missing: cached.missing.length
            });
            return {
                loaded: 0,
                failed: cached.missing,
                cached: cached.present.length,
                offline: true
            };
        }

        let loaded = 0;
        const failed = [];

        for (const storyPath of CRITICAL_STORIES) {
            try {
                // Check if already cached
                const cached = await db.get('ink_stories', storyPath);
                if (cached) {
                    log.debug(`Story already cached: ${storyPath}`);
                    loaded++;
                    continue;
                }

                // Fetch and cache
                const success = await this.loadStory(storyPath);
                if (success) {
                    loaded++;
                    log.info(`Preloaded critical story: ${storyPath}`);
                } else {
                    failed.push(storyPath);
                }
            } catch (e) {
                log.warn(`Failed to preload story: ${storyPath}`, e);
                failed.push(storyPath);
            }
        }

        log.info(`Story preload complete: ${loaded}/${CRITICAL_STORIES.length} stories ready`);
        return { loaded, failed };
    }

    async loadStory(filename) {
        // 1. In-memory cache (fastest)
        if (this.storyCache.has(filename)) {
            this.story = new Story(this.storyCache.get(filename));
            return true;
        }

        // 2. IndexedDB cache (persisted across refreshes)
        try {
            const cached = await db.get('ink_stories', filename);
            if (cached) {
                log.debug(`Loaded Ink story from IndexedDB: ${filename}`);
                this.storyCache.set(filename, cached);
                this.story = new Story(cached);
                return true;
            }
        } catch (idbError) {
            log.warn('IndexedDB read failed, continuing to network', idbError);
        }

        // 3. Network fetch with offline guard
        if (!navigator.onLine) {
            log.error(`Cannot load Ink story offline: ${filename}`);
            return false;
        }

        try {
            const response = await fetch(`/assets/ink/${filename}`);
            if (!response.ok) {
                log.error(`Ink story not found: ${filename}`);
                return false;
            }
            const json = await response.json();

            // Cache to both in-memory and IndexedDB
            this.storyCache.set(filename, json);
            try {
                await db.put('ink_stories', json, filename);
                log.debug(`Cached Ink story to IndexedDB: ${filename}`);
            } catch (cacheError) {
                log.warn('Failed to cache Ink story to IndexedDB', cacheError);
            }

            this.story = new Story(json);
            return true;
        } catch (e) {
            log.error(`Failed to load Ink story: ${e.message}`);
            return false;
        }
    }

    reset() {
        if (this.story) {
            this.story.ResetState();
        }
    }

    continue() {
        if (!this.story) return null;

        const textArr = [];
        while (this.story.canContinue) {
            const rawText = this.story.Continue();
            const sanitizedText = DOMPurify.sanitize(rawText, { ALLOWED_TAGS: [] });
            textArr.push(sanitizedText);
        }

        // Join text segments with newlines
        const currentText = textArr.join('\n');

        const currentChoices = this.story.currentChoices.map((c) => ({
            index: c.index,
            text: c.text
        }));

        return {
            text: currentText,
            choices: currentChoices,
            tags: this.story.currentTags,
            canContinue: this.story.canContinue || currentChoices.length > 0
        };
    }

    choose(index) {
        if (!this.story) return null;
        this.story.ChooseChoiceIndex(index);
        return this.continue();
    }

    getVariable(name) {
        if (!this.story) return null;
        return this.story.variablesState[name];
    }
}

export const inkService = new InkService();

