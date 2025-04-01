
import { API_URL } from './api';
import { WindowsUpdate } from './types';

// Windows Updates Operations
export const getWindowsUpdates = async (tenantId: string): Promise<WindowsUpdate[]> => {
  try {
    if (!tenantId) {
      console.error('No tenant ID provided to getWindowsUpdates');
      return [];
    }
    
    console.log(`Fetching Windows updates for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/windows-updates?tenantId=${tenantId}`);
    
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`Error fetching Windows updates: ${response.status} ${errorMessage}`);
      return [];
    }
    
    const updates: WindowsUpdate[] = await response.json();
    console.log(`Retrieved ${updates.length} Windows updates:`, updates);
    
    // Log the first item for debugging if available
    if (updates.length > 0) {
      console.log('Sample Windows update:', updates[0]);
    }
    
    return updates;
  } catch (error) {
    console.error('Error in getWindowsUpdates:', error);
    return [];
  }
};

export const fetchWindowsUpdates = async (tenantId: string): Promise<boolean> => {
  try {
    if (!tenantId) {
      console.error('No tenant ID provided to fetchWindowsUpdates');
      return false;
    }
    
    console.log(`Triggering Windows updates fetch for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-windows-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        tenantId,
        skipDatabaseCreation: true, // Flag to prevent creating new databases
        forceUseExistingDatabase: true // Extra flag to ensure only existing databases are used
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(`Error triggering Windows updates fetch: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Windows updates fetch result:', result);
    return true;
  } catch (error) {
    console.error('Error in fetchWindowsUpdates:', error);
    return false;
  }
};
