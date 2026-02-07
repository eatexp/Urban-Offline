import { EMERGENCY_PATTERNS, TRIAGE_STORIES } from '../../config/intentPatterns.js';

export const TriageRouter = {
    findTriageStory(userInput) {
        if (!userInput) return null;
        const input = userInput.toLowerCase();

        let bestMatch = null;
        let bestScore = 0;

        // First check TRIAGE_STORIES (individual story entries)
        for (const [key, story] of Object.entries(TRIAGE_STORIES)) {
            if (!story.triageStory) continue;

            const matches = story.keywords.filter(kw => input.includes(kw.toLowerCase()));

            if (matches.length > 0) {
                const score = matches.length * story.urgency;

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        story: story.triageStory,
                        title: story.title,
                        description: story.description,
                        keywords: story.keywords,
                        category: story.category,
                        key: key,
                        score: score
                    };
                }
            }
        }

        // Fall back to EMERGENCY_PATTERNS if no specific story matched
        if (!bestMatch) {
            for (const [key, pattern] of Object.entries(EMERGENCY_PATTERNS)) {
                if (!pattern.triageStory) continue;

                const matches = pattern.keywords.filter(kw => input.includes(kw.toLowerCase()));

                if (matches.length > 0) {
                    const score = matches.length * pattern.urgency;

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = {
                            story: pattern.triageStory,
                            keywords: pattern.keywords,
                            category: pattern.category,
                            key: key,
                            score: score
                        };
                    }
                }
            }
        }

        return bestMatch;
    },

    /**
     * Get all triage stories for a category
     * Used by Health, Law, and Survival pages to display available stories
     */
    getStoriesByCategory(category) {
        const stories = [];

        for (const [key, story] of Object.entries(TRIAGE_STORIES)) {
            if (story.triageStory && story.category === category) {
                stories.push({
                    story: story.triageStory,
                    title: story.title || key,
                    description: story.description || 'Interactive guide',
                    icon: story.icon,
                    keywords: story.keywords,
                    category: story.category,
                    key: key,
                    urgency: story.urgency
                });
            }
        }

        // Sort by urgency (highest first)
        return stories.sort((a, b) => b.urgency - a.urgency);
    },

    /**
     * Get all available triage stories
     */
    getAllStories() {
        const stories = [];

        for (const [key, story] of Object.entries(TRIAGE_STORIES)) {
            if (story.triageStory) {
                stories.push({
                    story: story.triageStory,
                    title: story.title || key,
                    description: story.description,
                    icon: story.icon,
                    category: story.category,
                    key: key,
                    urgency: story.urgency
                });
            }
        }

        return stories.sort((a, b) => b.urgency - a.urgency);
    }
};
