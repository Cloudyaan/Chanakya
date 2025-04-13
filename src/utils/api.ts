
// Base API utilities for communicating with the backend
import { msalInstance } from '../context/AuthContext';
import { loginRequest } from './authConfig';

// Use the exact URL that's shown in the Flask terminal output
export const API_URL = 'http://127.0.0.1:5000/api';

// Get access token for authenticated requests
const getAccessToken = async () => {
  try {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error('No active account! Sign in before making requests.');
    }
    
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: account
    });
    
    return response.accessToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

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

// Make authenticated API requests
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAccessToken();
  
  // Prepare headers with auth token if available
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  // Make the request with auth headers
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
};
