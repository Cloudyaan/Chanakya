import { TenantConfig, AzureConfig, TenantUpdate, License } from './types';

// Use the exact URL that's shown in the Flask terminal output
const API_URL = 'http://127.0.0.1:5000/api';

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

// M365 Tenant Operations
export const getTenants = async (): Promise<TenantConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/tenants`);
    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
};

export const addTenant = async (tenant: TenantConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenant),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add tenant');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding tenant:', error);
    return false;
  }
};

export const updateTenant = async (tenant: TenantConfig): Promise<boolean> => {
  try {
    if (!tenant.id) {
      console.error("Cannot update tenant: Missing ID");
      return false;
    }
    
    console.log(`Updating tenant in database (ID: ${tenant.id}):`, tenant);
    
    const response = await fetch(`${API_URL}/tenants/${tenant.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenant),
    });
    
    if (!response.ok) {
      console.error("API error response:", response.status);
      const errorData = await response.json().catch(() => null);
      console.error("Error details:", errorData);
      throw new Error('Failed to update tenant');
    }
    
    console.log("Tenant update successful");
    return true;
  } catch (error) {
    console.error('Error updating tenant:', error);
    return false;
  }
};

export const deleteTenant = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/tenants/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete tenant');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return false;
  }
};

// Azure Account Operations
export const getAzureAccounts = async (): Promise<AzureConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/azure`);
    if (!response.ok) {
      throw new Error('Failed to fetch Azure accounts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Azure accounts:', error);
    return [];
  }
};

export const addAzureAccount = async (account: AzureConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/azure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add Azure account');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding Azure account:', error);
    return false;
  }
};

export const updateAzureAccount = async (account: AzureConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/azure/${account.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update Azure account');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating Azure account:', error);
    return false;
  }
};

export const deleteAzureAccount = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/azure/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete Azure account');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting Azure account:', error);
    return false;
  }
};

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

// Get license data from the updated database structure
export const getLicenseData = async (tenantId: string): Promise<License[]> => {
  try {
    const url = `${API_URL}/licenses?tenantId=${tenantId}`;
    console.log(`Fetching license data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Error fetching license data:', response.status);
      // Return empty array on error
      return [];
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} licenses for tenant ID: ${tenantId}`);
    return data;
  } catch (error) {
    console.error('Error fetching license data:', error);
    return [];
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

// Function to fetch license data from Microsoft Graph for a specific tenant
export const fetchTenantLicenses = async (tenantId: string): Promise<boolean> => {
  try {
    console.log(`Triggering fetch-licenses for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-licenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching licenses:', errorData);
      throw new Error(errorData.message || 'Failed to fetch licenses');
    }
    
    return true;
  } catch (error) {
    console.error('Error triggering license fetch:', error);
    return false;
  }
};

// Generate mock updates for demonstration
const generateMockUpdates = (tenantId?: string): TenantUpdate[] => {
  // Create mock updates with the current tenantId
  return [
    {
      id: '1',
      tenantId: tenantId || 'default',
      tenantName: 'Demo Tenant',
      title: 'Microsoft Teams: New meeting experience',
      messageId: 'MC123456',
      description: 'We are introducing a new meeting experience in Microsoft Teams with enhanced features for better collaboration.',
      category: 'Microsoft Teams',
      severity: 'Medium',
      actionType: 'Informational',
      publishedDate: new Date().toISOString(),
    },
    {
      id: '2',
      tenantId: tenantId || 'default',
      tenantName: 'Demo Tenant',
      title: 'Microsoft 365: Important security update',
      messageId: 'MC654321',
      description: 'A critical security update is being rolled out to all Microsoft 365 applications. No action is required.',
      category: 'Security',
      severity: 'High',
      actionType: 'Action Required',
      publishedDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
    {
      id: '3',
      tenantId: tenantId || 'default',
      tenantName: 'Demo Tenant',
      title: 'SharePoint: New file sharing experience',
      messageId: 'MC789012',
      description: 'SharePoint is getting a new file sharing experience that makes it easier to share documents with internal and external users.',
      category: 'SharePoint',
      severity: 'Low',
      actionType: 'Plan for Change',
      publishedDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    }
  ];
};

// Generate mock updates specifically for MSAL-related errors
const generateMockUpdatesWithMsalError = (tenantId?: string): TenantUpdate[] => {
  const baseUpdates = generateMockUpdates(tenantId);
  
  // Add a special update about the MSAL dependency
  baseUpdates.unshift({
    id: 'msal-error',
    tenantId: tenantId || 'default',
    tenantName: 'System Message',
    title: 'Backend Configuration Required: MSAL Package Missing',
    messageId: 'SYS-MSAL-001',
    description: 'The backend server is missing the MSAL Python package required to fetch real data from Microsoft Graph. Please install it using "pip install msal" on the server.',
    category: 'System',
    severity: 'High',
    actionType: 'Action Required',
    publishedDate: new Date().toISOString(),
  });
  
  return baseUpdates;
};

// Generate mock updates with database-related message
const generateMockUpdatesWithDatabaseMessage = (tenantId?: string, message?: string): TenantUpdate[] => {
  const baseUpdates = generateMockUpdates(tenantId);
  
  // Add a special update about database initialization
  baseUpdates.unshift({
    id: 'db-init',
    tenantId: tenantId || 'default',
    tenantName: 'System Message',
    title: 'Data Initialization Required',
    messageId: 'SYS-DB-001',
    description: message || 'No update database found for this tenant. Run the fetch_updates.py script to retrieve data from Microsoft Graph API.',
    category: 'System',
    severity: 'Medium',
    actionType: 'Action Required',
    publishedDate: new Date().toISOString(),
  });
  
  return baseUpdates;
};
