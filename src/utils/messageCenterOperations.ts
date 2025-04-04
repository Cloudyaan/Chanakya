
import { TenantUpdate } from './types';
import { API_URL } from './api';

// Message Center Updates Operations
export const getTenantUpdates = async (tenantId?: string, limit: number = 100): Promise<TenantUpdate[]> => {
  try {
    if (!tenantId) {
      console.error('No tenant ID provided to getTenantUpdates');
      return [];
    }
    
    // Build the URL with the tenantId and limit
    const url = `${API_URL}/updates?tenantId=${tenantId}&source=message-center&limit=${limit}`;
    
    console.log(`Fetching tenant updates from: ${url}`);
    
    const response = await fetch(url);
    
    // Handle different response status codes
    if (!response.ok) {
      console.error('Error response status:', response.status);
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Error parsing error response');
      }
      
      // Return empty array if there's an error
      return [];
    }
    
    // If response is OK, parse and return the data
    const data = await response.json();
    console.log(`Received ${data.length} message center updates for tenant ID: ${tenantId}`);
    
    // Log the first item for debugging
    if (data.length > 0) {
      console.log('Sample update item:', data[0]);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tenant updates:', error);
    // Return empty array in case of any error
    return [];
  }
};

// Function to fetch updates from Microsoft Graph for a specific tenant
export const fetchTenantUpdates = async (tenantId: string): Promise<boolean> => {
  try {
    if (!tenantId) {
      console.error('No tenant ID provided to fetchTenantUpdates');
      return false;
    }
    
    console.log(`Triggering fetch-updates for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        tenantId, 
        skipDatabaseCreation: true,
        forceUseExistingDatabase: true,
        fixCompatibility: true, // Flag to fix compatibility issues
        forceExactDateFilter: true, // Flag to enforce exact date filtering
        useCompleteDay: true // Use complete day for filtering (00:00:00 to 23:59:59)
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching updates:', errorData);
      throw new Error(errorData.message || 'Failed to fetch updates');
    }
    
    const result = await response.json();
    console.log('Fetch updates response:', result);
    return true;
  } catch (error) {
    console.error('Error triggering update fetch:', error);
    return false;
  }
};
