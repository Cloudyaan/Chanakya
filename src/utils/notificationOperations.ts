
import { API_URL } from './api';
import { NotificationSetting } from './types';

// Function to get all notification settings
export const getNotificationSettings = async (tenantId?: string): Promise<NotificationSetting[]> => {
  try {
    let url = `${API_URL}/notification-settings`;
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching notification settings: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getNotificationSettings:', error);
    return [];
  }
};

// Function to add a new notification setting
export const addNotificationSetting = async (setting: Omit<NotificationSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string } | null> => {
  try {
    const response = await fetch(`${API_URL}/notification-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setting),
    });
    
    if (!response.ok) {
      throw new Error(`Error adding notification setting: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in addNotificationSetting:', error);
    return null;
  }
};

// Function to update an existing notification setting
export const updateNotificationSetting = async (id: string, setting: Partial<NotificationSetting>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/notification-settings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setting),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error in updateNotificationSetting:', error);
    return false;
  }
};

// Function to delete a notification setting
export const deleteNotificationSetting = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/notification-settings/${id}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error in deleteNotificationSetting:', error);
    return false;
  }
};

// Function to send a notification immediately with proper settings verification
export const sendNotification = async (id: string): Promise<boolean> => {
  try {
    console.log(`Sending notification ${id} with proper settings verification`);
    const response = await fetch(`${API_URL}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id,
        useExistingDatabases: true,
        verifySettings: true, // Add flag to verify settings before sending
        checkPeriod: true,    // Enable proper time period checking based on frequency
        fixEmailTemplate: true // New flag to ensure email template fixes are applied
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from send-notification:', errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return false;
  }
};
