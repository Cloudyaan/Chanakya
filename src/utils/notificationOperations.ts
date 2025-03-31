
import { API_URL } from './api';
import { NotificationSetting } from './types';

// Helper function to ensure arrays are properly handled
const ensureArray = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

// Helper to normalize legacy 'Monthly' frequency to 'Weekly'
const normalizeFrequency = (frequency: string): 'Daily' | 'Weekly' => {
  return (frequency === 'Monthly') ? 'Weekly' : (frequency as 'Daily' | 'Weekly');
};

export const getNotificationSettings = async (tenantId?: string): Promise<NotificationSetting[]> => {
  try {
    const url = tenantId 
      ? `${API_URL}/notification-settings?tenantId=${tenantId}`
      : `${API_URL}/notification-settings`;
      
    console.log(`Fetching notification settings from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching notification settings: ${response.statusText}`);
    }
    
    const settings = await response.json();
    console.log(`Retrieved ${settings.length} notification settings`);
    
    // Ensure tenants, update_types, and frequency are properly normalized
    return settings.map((setting: any): NotificationSetting => ({
      ...setting,
      tenants: ensureArray(setting.tenants),
      update_types: ensureArray(setting.update_types),
      frequency: normalizeFrequency(setting.frequency)
    }));
  } catch (error) {
    console.error('Error in getNotificationSettings:', error);
    return [];
  }
};

export const addNotificationSetting = async (
  setting: {
    name: string;
    email: string;
    tenants: string[];
    update_types: string[];
    frequency: 'Daily' | 'Weekly';
  }
): Promise<{ success: boolean; id?: string; message: string }> => {
  try {
    console.log('Adding notification setting:', setting);
    const response = await fetch(`${API_URL}/notification-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setting),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to add notification setting');
    }
    
    console.log('Add notification setting result:', result);
    return {
      success: true,
      id: result.id,
      message: result.message
    };
  } catch (error: any) {
    console.error('Error in addNotificationSetting:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while adding the notification setting'
    };
  }
};

export const updateNotificationSetting = async (
  id: string,
  updates: Partial<Omit<NotificationSetting, 'id' | 'name' | 'email' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Updating notification setting ${id}:`, updates);
    const response = await fetch(`${API_URL}/notification-settings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to update notification setting');
    }
    
    console.log('Update notification setting result:', result);
    return {
      success: true,
      message: result.message
    };
  } catch (error: any) {
    console.error('Error in updateNotificationSetting:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while updating the notification setting'
    };
  }
};

export const deleteNotificationSetting = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Deleting notification setting ${id}`);
    const response = await fetch(`${API_URL}/notification-settings/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to delete notification setting');
    }
    
    console.log('Delete notification setting result:', result);
    return {
      success: true,
      message: result.message
    };
  } catch (error: any) {
    console.error('Error in deleteNotificationSetting:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while deleting the notification setting'
    };
  }
};

// Function to send a notification immediately
export const sendNotificationNow = async (id: string): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    console.log(`Sending notification ${id} now`);
    const response = await fetch(`${API_URL}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to send notification');
    }
    
    console.log('Send notification result:', result);
    return {
      success: true,
      message: result.message,
      results: result.results
    };
  } catch (error: any) {
    console.error('Error in sendNotificationNow:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while sending the notification'
    };
  }
};
