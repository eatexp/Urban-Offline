import { db } from './db';

import blsContent from '../data/guides/basic-life-support.md?raw';

// Mock available guides
const AVAILABLE_GUIDES = [
    {
        id: 'first-aid-basic',
        name: 'Basic Life Support (BLS)',
        description: 'WHO & ILCOR aligned guide for CPR, AED, and emergency response.',
        size: '2.5 KB',
        type: 'markdown',
        content: blsContent
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
