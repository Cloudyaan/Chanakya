
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initDatabases } from './utils/database';

// Initialize databases at application startup
initDatabases()
  .then(success => {
    console.log('Database initialization:', success ? 'successful' : 'failed');
  })
  .catch(error => {
    console.error('Failed to initialize databases:', error);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
