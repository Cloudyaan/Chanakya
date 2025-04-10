
// Base API utilities for communicating with the backend

// Use HTTPS URL to avoid Mixed Content errors when frontend is served via HTTPS
export const API_URL = 'https://mc-backend-dte2cedre8d6arg7.westeurope-01.azurewebsites.net/api';

// Initialize backend connection
export const initDatabases = async (): Promise<boolean> => {
  try {
    console.log('Attempting to connect to backend at:', API_URL);
    
    // Test connection to backend
    const response = await fetch(`${API_URL}/tenants`);
    if (response.ok) {
      console.log('Backend connection established successfully');
      return true;
    } else {
      console.error('Backend connection failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return false;
  }
};
