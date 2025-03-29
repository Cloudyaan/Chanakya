
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
      console.warn('Windows updates service not available or returned an error, using mock data');
      return generateMockWindowsUpdates(tenantId);
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} Windows updates for tenant ID: ${tenantId || 'all'}`);
    return data;
  } catch (error) {
    console.error('Error fetching Windows updates:', error);
    return generateMockWindowsUpdates(tenantId);
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

// Helper function to generate mock Windows updates data for testing
const generateMockWindowsUpdates = (tenantId?: string): WindowsUpdate[] => {
  return [
    {
      id: "win-update-1",
      tenantId: tenantId || "default-tenant",
      productId: "windows-11",
      productName: "Windows 11",
      title: "May 2025 Cumulative Update for Windows 11",
      description: "This update includes quality improvements and security fixes.",
      severity: "High",
      status: "Released",
      firstOccurredDate: "2025-05-10T00:00:00Z",
      resolvedDate: null
    },
    {
      id: "win-update-2",
      tenantId: tenantId || "default-tenant",
      productId: "windows-10",
      productName: "Windows 10",
      title: "April 2025 Security Update for Windows 10",
      description: "Critical security patches for Windows 10 devices.",
      severity: "Critical",
      status: "Released",
      firstOccurredDate: "2025-04-12T00:00:00Z",
      resolvedDate: null
    },
    {
      id: "win-update-3",
      tenantId: tenantId || "default-tenant",
      productId: "windows-server-2022",
      productName: "Windows Server 2022",
      title: "Known Issue: Printing problems after update KB5025885",
      description: "After installing KB5025885, some users may experience issues with network printing.",
      severity: "Medium",
      status: "Investigating",
      firstOccurredDate: "2025-03-15T00:00:00Z",
      resolvedDate: null
    }
  ];
};
