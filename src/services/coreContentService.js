/**
 * Core Content Service
 * Loads essential preloaded content into the database on first launch.
 */

import { db } from './db';
import { SearchService } from './SearchService';
import { CORE_HEALTH_CONTENT, CORE_SURVIVAL_CONTENT, CORE_LAW_CONTENT } from '../data/coreContent';
import { createLogger } from '../utils/logger';

const log = createLogger('CoreContent');

const CORE_CONTENT_VERSION = 1;
const CORE_CONTENT_KEY = 'core_content_initialized';

/**
 * Check if core content has been initialized
 */
async function isCoreContentInitialized() {
  try {
    const meta = await db.get('datasets', CORE_CONTENT_KEY);
    return meta && meta.version === CORE_CONTENT_VERSION;
  } catch {
    return false;
  }
}

/**
 * Mark core content as initialized
 */
async function markCoreContentInitialized() {
  await db.put('datasets', {
    id: CORE_CONTENT_KEY,
    version: CORE_CONTENT_VERSION,
    initializedAt: new Date().toISOString(),
    type: 'system'
  });
}

/**
 * Load core content into the appropriate stores
 */
async function loadCoreContent() {
  log.info('Loading core content into stores...');

  let healthCount = 0;
  let survivalCount = 0;
  let lawCount = 0;

  // Load health content
  for (const article of CORE_HEALTH_CONTENT) {
    await db.put('health_content', {
      ...article,
      importedAt: new Date().toISOString(),
      isCore: true
    });

    // Add to search index
    await SearchService.addDocument({
      id: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      description: article.summary,
      category: 'health'
    });

    healthCount++;
  }

  // Load survival content
  for (const article of CORE_SURVIVAL_CONTENT) {
    await db.put('survival_content', {
      ...article,
      importedAt: new Date().toISOString(),
      isCore: true
    });

    await SearchService.addDocument({
      id: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      description: article.summary,
      category: 'survival'
    });

    survivalCount++;
  }

  // Load law content
  for (const article of CORE_LAW_CONTENT) {
    await db.put('law_content', {
      ...article,
      importedAt: new Date().toISOString(),
      isCore: true
    });

    await SearchService.addDocument({
      id: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      description: article.summary,
      category: 'law'
    });

    lawCount++;
  }

  log.info(`Loaded core content: ${healthCount} health, ${survivalCount} survival, ${lawCount} law articles`);

  return { healthCount, survivalCount, lawCount };
}

/**
 * Initialize core content if not already done
 * Call this during app startup after storage is initialized
 */
export async function initializeCoreContent() {
  try {
    const isInitialized = await isCoreContentInitialized();

    if (isInitialized) {
      log.info('Core content already initialized');
      return { alreadyInitialized: true };
    }

    const counts = await loadCoreContent();
    await markCoreContentInitialized();

    log.info('Core content initialization complete');
    return {
      alreadyInitialized: false,
      ...counts,
      total: counts.healthCount + counts.survivalCount + counts.lawCount
    };
  } catch (error) {
    log.error('Failed to initialize core content', error);
    throw error;
  }
}

/**
 * Force reload core content (for updates)
 */
export async function reloadCoreContent() {
  log.info('Force reloading core content...');

  // Remove existing core content
  const healthContent = await db.getAll('health_content');
  const survivalContent = await db.getAll('survival_content');
  const lawContent = await db.getAll('law_content');

  for (const item of healthContent.filter(c => c.isCore)) {
    await db.delete('health_content', item.id);
  }
  for (const item of survivalContent.filter(c => c.isCore)) {
    await db.delete('survival_content', item.id);
  }
  for (const item of lawContent.filter(c => c.isCore)) {
    await db.delete('law_content', item.id);
  }

  // Reset initialization flag
  await db.delete('datasets', CORE_CONTENT_KEY);

  // Reload
  return initializeCoreContent();
}

/**
 * Get content from a specific store
 */
export async function getContentByCategory(category) {
  const storeMap = {
    health: 'health_content',
    survival: 'survival_content',
    law: 'law_content'
  };

  const storeName = storeMap[category];
  if (!storeName) {
    throw new Error(`Unknown category: ${category}`);
  }

  return db.getAll(storeName);
}

/**
 * Get a single article by slug from any store
 */
export async function getArticleBySlug(slug) {
  // Check all stores
  const stores = ['health_content', 'survival_content', 'law_content'];

  for (const storeName of stores) {
    const content = await db.getAll(storeName);
    const article = content.find(c => c.slug === slug);
    if (article) {
      return article;
    }
  }

  return null;
}

export const coreContentService = {
  initialize: initializeCoreContent,
  reload: reloadCoreContent,
  getByCategory: getContentByCategory,
  getBySlug: getArticleBySlug
};
