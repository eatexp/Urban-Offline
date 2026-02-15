import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStorage, contentSync } from './services/db';
import { createLogger } from './utils/logger';
import { AppProvider } from './context/AppProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { inkService } from './services/InkService';

const log = createLogger('Main');

const startApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </React.StrictMode>
  );

  // Preload critical triage stories for offline availability
  // This ensures life-safety guides (CPR, choking, etc.) are cached
  inkService.preloadCriticalStories().then(({ failed }) => {
    if (failed.length > 0) {
      log.warn(`Failed to preload ${failed.length} critical stories:`, failed);
    }
  }).catch(err => {
    log.warn('Story preload failed:', err);
  });
};

initStorage()
  .then(() => contentSync.syncBundledContent())
  .then(() => startApp())
  .catch(err => {
    log.error('Storage initialization failed:', err);
    // Start the app anyway — components can handle missing storage gracefully
    startApp();
  });
