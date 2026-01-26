import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStorage } from './services/db';
import { SearchService } from './services/SearchService';
import { Capacitor } from '@capacitor/core';
import { getDBConnection } from './services/storage/NativeStorage';
import { createLogger } from './utils/logger';
import { AppProvider } from './context/AppProvider';

const log = createLogger('Main');

const startApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
};

startApp();
