
import { TenantConfig } from './types';
import { API_URL } from './api';

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
