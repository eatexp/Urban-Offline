export const TRIAGE_ROUTES = [
    // --- HEALTH (Medical) ---
    {
        story: 'hypothermia.ink.json',
        keywords: ['cold', 'freezing', 'shivering', 'blue lips', 'hypothermia', 'exposure', 'wet'],
        category: 'health'
    },
    {
        story: 'health/cpr.ink.json',
        keywords: ['cpr', 'cardiac arrest', 'not breathing', 'unresponsive', 'heart stopped', 'resuscitation', 'chest compressions'],
        category: 'health'
    },
    {
        story: 'health/severe-bleeding.ink.json',
        keywords: ['bleeding', 'blood', 'hemorrhage', 'cut', 'wound', 'tourniquet', 'pressure', 'artery'],
        category: 'health'
    },
    {
        story: 'health/choking.ink.json',
        keywords: ['choking', 'can\'t breathe', 'obstruction', 'heimlich', 'airway blocked', 'coughing', 'gagging'],
        category: 'health'
    },

    // --- LEGAL RIGHTS (UK) ---
    {
        story: 'legal/stop-and-search.ink.json',
        keywords: ['stop', 'search', 'police', 'grounds', 'warrant', 'gowisely', 'detained'],
        category: 'legal'
    },
    {
        story: 'legal/arrest-rights.ink.json',
        keywords: ['arrest', 'rights', 'custody', 'solicitor', 'lawyer', 'silent', 'caution'],
        category: 'legal'
    },
    {
        story: 'legal/custody-rights.ink.json',
        keywords: ['cell', 'station', 'phone', 'call', 'review', 'detention', 'time'],
        category: 'legal'
    },

    // --- SURVIVAL SKILLS ---
    {
        story: 'survival/water-purification.ink.json',
        keywords: ['water', 'drink', 'thirsty', 'purify', 'filter', 'boil', 'hydration'],
        category: 'survival'
    },
    {
        story: 'survival/shelter-building.ink.json',
        keywords: ['shelter', 'house', 'roof', 'rain', 'cold', 'wind', 'sleep', 'camp'],
        category: 'survival'
    },
    {
        story: 'survival/fire-making.ink.json',
        keywords: ['fire', 'flame', 'heat', 'warm', 'cook', 'light', 'match', 'burn'],
        category: 'survival'
    },
    {
        story: 'survival/signaling.ink.json',
        keywords: ['signal', 'rescue', 'help', 'aircraft', 'whistle', 'mirror', 'found'],
        category: 'survival'
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
