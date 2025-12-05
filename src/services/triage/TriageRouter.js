export const TRIAGE_ROUTES = [
    {
        story: 'hypothermia.ink.json',
        keywords: ['cold', 'freezing', 'shivering', 'blue lips', 'hypothermia', 'exposure', 'wet'],
        category: 'health'
    },
    // Placeholders for future stories
    {
        story: 'bleeding.ink.json',
        keywords: ['bleeding', 'blood', 'cut', 'wound', 'laceration', 'hemorrhage'],
        category: 'health'
    },
    {
        story: 'choking.ink.json',
        keywords: ['choking', 'cant breathe', 'airway', 'heimlich', 'obstruction'],
        category: 'health'
    },
    {
        story: 'stop_and_search.ink.json',
        keywords: ['stop and search', 'police search', 'searched by police', 'pace code a'],
        category: 'legal'
    }
];

export const TriageRouter = {
    findTriageStory(userInput) {
        if (!userInput) return null;
        const input = userInput.toLowerCase();

        const matches = TRIAGE_ROUTES
            .map(route => ({
                ...route,
                score: route.keywords.filter(kw => input.includes(kw)).length
            }))
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score);

        return matches[0] || null;
    },

    getStoriesByCategory(category) {
        return TRIAGE_ROUTES.filter(r => r.category === category);
    }
};
