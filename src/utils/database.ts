
import { TenantConfig, AzureConfig } from './types';

const API_URL = 'http://localhost:5000/api';

// Initialize backend connection
export const initDatabases = async (): Promise<boolean> => {
  try {
    // Test connection to backend
    const response = await fetch(`${API_URL}/tenants`);
    if (response.ok) {
      console.log('Backend connection established successfully');
      return true;
    } else {
      console.error('Backend connection failed');
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
