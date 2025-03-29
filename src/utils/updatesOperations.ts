
import { TenantUpdate, WindowsUpdate } from './types';
import { API_URL } from './api';
import { generateMockUpdates, generateMockUpdatesWithDatabaseMessage, generateMockUpdatesWithMsalError } from './mockData';

// Message Center Updates Operations
export const getTenantUpdates = async (tenantId?: string): Promise<TenantUpdate[]> => {
  try {
    // Build the URL with the tenantId if provided
    const url = tenantId 
      ? `${API_URL}/updates?tenantId=${tenantId}` 
      : `${API_URL}/updates`;
    
    console.log(`Fetching tenant updates from: ${url}`);
    
    const response = await fetch(url);
    
    // Handle different response status codes
    if (!response.ok) {
      // Parse the error response if possible
      try {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        
        // Check specifically for database naming convention errors
        if (errorData.message && errorData.message.includes('database not found') || 
            errorData.message && errorData.message.includes('run the fetch_updates.py script')) {
          console.error('Database not found with tenant ID. This could be a naming convention issue.');
          console.log('Looking for database name format: service_announcements_tenantId.db or TenantName_tenantId.db');
          return generateMockUpdatesWithDatabaseMessage(tenantId, errorData.message);
        }
        
        // Check specifically for MSAL dependency error
        if (errorData.error === 'MSAL package not installed' || 
            (errorData.message && errorData.message.includes('msal'))) {
          console.error('MSAL package missing on server');
          return generateMockUpdatesWithMsalError(tenantId);
        }
        
        // If endpoint returns 404 (Not Found)
        if (response.status === 404) {
          console.warn('No updates found for this tenant, using mock data');
          if (errorData.message && errorData.message.includes('database')) {
            return generateMockUpdatesWithDatabaseMessage(tenantId, errorData.message);
          }
          return generateMockUpdates(tenantId);
        }
        
        // If endpoint returns 501 (Not Implemented) or 503 (Service Unavailable)
        if (response.status === 501 || response.status === 503) {
          console.warn('Updates service not implemented or unavailable, using mock data');
          return generateMockUpdates(tenantId);
        }
        
        // If the error mentions MSAL package, provide specific mock data
        if (errorData.error && errorData.error.includes('msal') || 
            errorData.message && errorData.message.includes('msal')) {
          console.warn('MSAL package missing on server, using mock data');
          return generateMockUpdatesWithMsalError(tenantId);
        }
        
      } catch (e) {
        // If we can't parse the error JSON, just log the status
        console.error('Error response status:', response.status);
      }
      
      // Default to mock data if we can't determine the specific error
      return generateMockUpdates(tenantId);
    }
    
    // If response is OK, parse and return the data
    const data = await response.json();
    console.log(`Received ${data.length} updates for tenant ID: ${tenantId || 'all'}`);
    return data;
  } catch (error) {
    console.error('Error fetching tenant updates:', error);
    // Return mock data in case of any error
    return generateMockUpdates(tenantId);
  }
};

// Function to fetch updates from Microsoft Graph for a specific tenant
export const fetchTenantUpdates = async (tenantId: string): Promise<boolean> => {
  try {
    console.log(`Triggering fetch-updates for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching updates:', errorData);
      throw new Error(errorData.message || 'Failed to fetch updates');
    }
    
    return true;
  } catch (error) {
    console.error('Error triggering update fetch:', error);
    return false;
  }
};

// Windows Updates Operations
export const getWindowsUpdates = async (tenantId?: string): Promise<WindowsUpdate[]> => {
  try {
    const url = tenantId 
      ? `${API_URL}/windows-updates?tenantId=${tenantId}` 
      : `${API_URL}/windows-updates`;
    
    console.log(`Fetching Windows updates from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Windows updates service returned an error: ${response.status} ${response.statusText}`);
      
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      
      // Return empty array to show "No updates available" instead of using mock data
      return [];
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} Windows updates for tenant ID: ${tenantId || 'all'}`);
    
    // Map the data to ensure all fields are properly handled
    return data.map((update: any) => ({
      id: update.id || '',
      tenantId: tenantId || update.tenantId || '',
      productId: update.product_id || update.productId || '',
      productName: update.product_name || update.productName || null,
      title: update.title || null,
      description: update.description || null,
      webViewUrl: update.web_view_url || update.webViewUrl || null,
      status: update.status || null,
      startDate: update.start_date || update.startDate || update.startDateTime || null,
      resolvedDate: update.resolved_date || update.resolvedDate || update.resolvedDateTime || null
    }));
  } catch (error) {
    console.error('Error fetching Windows updates:', error);
    // Return empty array to show "No updates available" instead of using mock data
    return [];
  }
};

export const fetchWindowsUpdates = async (tenantId: string): Promise<boolean> => {
  try {
    console.log(`Triggering fetch-windows-updates for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-windows-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching Windows updates:', errorData);
      throw new Error(errorData.message || 'Failed to fetch Windows updates');
    }
    
    return true;
  } catch (error) {
    console.error('Error triggering Windows update fetch:', error);
    return false;
  }
};
