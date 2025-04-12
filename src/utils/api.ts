
// Base API utilities for communicating with the backend
import { useAuth } from './authContext';

// Use the exact URL that's shown in the Flask terminal output, but with https for production
export const API_URL = import.meta.env.NODE_ENV === 'production' 
  ? 'https://your-azure-app-url.azurewebsites.net/api'
  : 'http://127.0.0.1:5000/api';

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

// Helper function to make authenticated API requests
export const fetchWithAuth = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Get the authentication from the context
  const auth = useAuth();
  const token = await auth.getAuthToken();
  
  // Add the token to the headers if available
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  // Return the fetch with the updated headers
  return fetch(url, {
    ...options,
    headers
  });
};
