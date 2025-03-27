
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initDatabases } from './utils/database';

// Initialize databases at application startup
// Add error handling to prevent application failure if backend is not available
initDatabases()
  .then(success => {
    console.log('Database initialization:', success ? 'successful' : 'failed');
  })
  .catch(error => {
    console.error('Failed to initialize databases:', error);
    console.warn('Application will continue to load, but backend features may not work.');
  });

// Use a try-catch block to make sure the app renders even if there are issues
try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Display a fallback UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Application Error</h1>
        <p>Sorry, there was a problem loading the application.</p>
        <p>Try refreshing the page or contact support if the issue persists.</p>
      </div>
    `;
  }
}
