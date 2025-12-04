import { db } from './db';

// Mock available guides
const AVAILABLE_GUIDES = [
    {
        id: 'first-aid-basic',
        name: 'Basic First Aid',
        description: 'Essential first aid procedures for common emergencies.',
        size: '0.5 MB',
        type: 'markdown',
        content: `
# Basic First Aid

## CPR
1. Call emergency services.
2. Push hard and fast in the center of the chest.

## Burns
1. Cool the burn with cool running water for at least 10 minutes.
2. Cover with cling film or a clean plastic bag.

## Bleeding
1. Apply pressure to the wound.
2. Elevate the injury if possible.
        `
    },
    {
        id: 'survival-urban',
        name: 'Urban Survival Guide',
        description: 'Tips for surviving in an urban environment without services.',
        size: '1.2 MB',
        type: 'markdown',
        content: `
# Urban Survival

## Water
- Locate safe water sources.
- Boil water for at least 1 minute before drinking.

## Shelter
- Stay indoors if safe.
- Insulate a small room to conserve heat.
        `
    }
];

export const guideManager = {
    async getAvailableGuides() {
        const installed = await db.getAll('guides');
        const installedIds = new Set(installed.map(g => g.id));

        return AVAILABLE_GUIDES.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            size: g.size,
            isInstalled: installedIds.has(g.id)
        }));
    },

    async installGuide(guideId) {
        const guide = AVAILABLE_GUIDES.find(g => g.id === guideId);
        if (!guide) throw new Error('Guide not found');

        // Save metadata
        await db.put('guides', {
            id: guide.id,
            name: guide.name,
            description: guide.description,
            size: guide.size,
            type: guide.type,
            installedAt: new Date().toISOString()
        });

        // Save content
        await db.put('guide_content', {
            id: guide.id,
            content: guide.content
        });

        return true;
    },

    async uninstallGuide(guideId) {
        await db.delete('guides', guideId);
        await db.delete('guide_content', guideId);
        return true;
    },

    async getInstalledGuideContent(guideId) {
        const record = await db.get('guide_content', guideId);
        return record ? record.content : null;
    }
};
