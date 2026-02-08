import { dataManager } from './services/dataManager';
import { articleService } from './services/articleService';

export const homeLoader = async () => {
    try {
        const regions = await dataManager.getInstalledRegions();
        return {
            status: regions.length > 0 ? 'prepared' : 'not-prepared',
            activeRegion: regions[0] || null
        };
    } catch (error) {
        return { status: 'not-prepared', activeRegion: null, error };
    }
};

export const articleLoader = async ({ params }) => {
    const article = await articleService.getArticleBySlug(params.slug);
    if (!article) throw new Error('Article not found');
    return article;
};
