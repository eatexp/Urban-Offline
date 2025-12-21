import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStorage } from './services/db';
import { SearchService } from './services/SearchService';
import { Capacitor } from '@capacitor/core';
import { getDBConnection } from './services/storage/NativeStorage';
import { createLogger } from './utils/logger';

const log = createLogger('Main');

const startApp = async () => {
  try {
    await initStorage();
    log.info('Storage initialized');
    
    // Initialize search service (this will index existing content)
    await SearchService.init();
    
    // For native platform, also index articles from SQLite
    if (Capacitor.isNativePlatform()) {
      try {
        const db = await getDBConnection();
        const articles = await db.query('SELECT id, slug, title, body_plain FROM articles LIMIT 1000');
        if (articles.values && articles.values.length > 0) {
          for (const article of articles.values) {
            await SearchService.addDocument({
              id: article.id,
              slug: article.slug,
              title: article.title,
              content: article.body_plain || '',
              description: article.title,
              category: 'health'
            });
          }
          log.info(`Indexed ${articles.values.length} articles from SQLite`);
        }
      } catch (e) {
        log.warn('Failed to index SQLite articles (may not exist yet)', e.message);
      }
    }
  } catch (e) {
    log.error('Storage initialization failed', e);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

startApp();
