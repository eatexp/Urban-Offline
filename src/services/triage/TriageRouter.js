import { IntentClassifier } from '../ai/IntentClassifier';

// Generate routes dynamically from the unified intent definition
// This ensures TriageRouter matches the same patterns as Search and Alerts.
const getRoutes = () => {
    const routes = [];

    for (const [key, pattern] of Object.entries(IntentClassifier.EMERGENCY_PATTERNS)) {
        // Only include patterns that have a triage story
        if (pattern.triageStory) {
            routes.push({
                story: pattern.triageStory,
                keywords: pattern.keywords,
                category: pattern.category,
                key: key
            });
        }
    }
    // Add mapped stories from KEYWORD_TO_TRIAGE that might not be main categories
    // (This step is implicit if we stick to the main EMERGENCY_PATTERNS which is cleaner)
    return routes;
};

export const TriageRouter = {
    findTriageStory(userInput) {
        if (!userInput) return null;
        const input = userInput.toLowerCase();

        const routes = getRoutes();

        // Simple keyword scoring
        const matches = routes
            .map(route => ({
                ...route,
                score: route.keywords.filter(kw => input.includes(kw.toLowerCase())).length
            }))
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score);

        return matches[0] || null;
    },

    getStoriesByCategory(category) {
        return getRoutes().filter(r => r.category === category);
    }
};
