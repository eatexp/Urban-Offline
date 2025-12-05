import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStorage } from './services/db';

const startApp = async () => {
  try {
    await initStorage();
    console.log('Storage Initialized');
  } catch (e) {
    console.error('Storage Init Failed', e);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

startApp();
