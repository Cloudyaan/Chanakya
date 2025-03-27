
import { TenantConfig, AzureConfig, TenantUpdate } from './types';

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
    const response = await fetch(`${API_URL}/tenants/${tenant.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tenant),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update tenant');
    }
    
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
    const url = tenantId 
      ? `${API_URL}/updates?tenantId=${tenantId}` 
      : `${API_URL}/updates`;
    
    const response = await fetch(url);
    if (!response.ok) {
      // If endpoint not found (404), return mock data
      if (response.status === 404) {
        console.warn('Updates endpoint not available, using mock data');
        return generateMockUpdates(tenantId);
      }
      throw new Error('Failed to fetch tenant updates');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tenant updates:', error);
    // Return mock data in case of any error
    return generateMockUpdates(tenantId);
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
