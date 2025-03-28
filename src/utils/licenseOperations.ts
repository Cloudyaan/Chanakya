
import { License } from './types';
import { API_URL } from './api';

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
