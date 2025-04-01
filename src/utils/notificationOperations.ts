
import { API_URL } from './api';
import { NotificationSetting } from './types';

/**
 * Enhanced function to get all notification settings with better error handling
 * @param tenantId Optional tenant ID to filter settings
 * @returns Promise with notification settings array
 */
export const getNotificationSettings = async (tenantId?: string): Promise<NotificationSetting[]> => {
  console.log(`[NotificationOps] Fetching notification settings${tenantId ? ` for tenant: ${tenantId}` : ''}`);
  try {
    let url = `${API_URL}/notification-settings`;
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }
    
    console.log(`[NotificationOps] Request URL: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationOps] Error fetching notification settings: Status ${response.status} - ${response.statusText}`);
      console.error(`[NotificationOps] Error response body: ${errorText}`);
      throw new Error(`Error fetching notification settings: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json();
    console.log(`[NotificationOps] Successfully fetched ${data.length} notification settings`);
    return data;
  } catch (error) {
    console.error('[NotificationOps] Error in getNotificationSettings:', error);
    return [];
  }
};

/**
 * Enhanced function to add a new notification setting with better error handling
 * @param setting The notification setting to add
 * @returns Promise with the ID of the created setting or null if failed
 */
export const addNotificationSetting = async (setting: Omit<NotificationSetting, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string } | null> => {
  console.log('[NotificationOps] Adding new notification setting:', {
    name: setting.name,
    email: setting.email,
    tenantsCount: setting.tenants.length,
    updateTypesCount: setting.update_types.length,
    frequency: setting.frequency
  });
  
  try {
    const requestBody = JSON.stringify(setting);
    console.log(`[NotificationOps] Request body: ${requestBody}`);
    
    const response = await fetch(`${API_URL}/notification-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationOps] Error adding notification setting: Status ${response.status} - ${response.statusText}`);
      console.error(`[NotificationOps] Error response body: ${errorText}`);
      throw new Error(`Error adding notification setting: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json();
    console.log(`[NotificationOps] Successfully added notification setting with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('[NotificationOps] Error in addNotificationSetting:', error);
    return null;
  }
};

/**
 * Enhanced function to update an existing notification setting with better error handling
 * @param id The ID of the setting to update
 * @param setting The partial notification setting data to update
 * @returns Promise with boolean indicating success or failure
 */
export const updateNotificationSetting = async (id: string, setting: Partial<NotificationSetting>): Promise<boolean> => {
  console.log(`[NotificationOps] Updating notification setting ${id} with data:`, setting);
  
  try {
    const requestBody = JSON.stringify(setting);
    console.log(`[NotificationOps] Request body: ${requestBody}`);
    
    const response = await fetch(`${API_URL}/notification-settings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationOps] Error updating notification setting: Status ${response.status} - ${response.statusText}`);
      console.error(`[NotificationOps] Error response body: ${errorText}`);
      throw new Error(`Error updating notification setting: ${response.statusText} (${response.status})`);
    }
    
    console.log(`[NotificationOps] Successfully updated notification setting ${id}`);
    return true;
  } catch (error) {
    console.error(`[NotificationOps] Error in updateNotificationSetting for ID ${id}:`, error);
    return false;
  }
};

/**
 * Enhanced function to delete a notification setting with better error handling
 * @param id The ID of the setting to delete
 * @returns Promise with boolean indicating success or failure
 */
export const deleteNotificationSetting = async (id: string): Promise<boolean> => {
  console.log(`[NotificationOps] Deleting notification setting ${id}`);
  
  try {
    const response = await fetch(`${API_URL}/notification-settings/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationOps] Error deleting notification setting: Status ${response.status} - ${response.statusText}`);
      console.error(`[NotificationOps] Error response body: ${errorText}`);
      throw new Error(`Error deleting notification setting: ${response.statusText} (${response.status})`);
    }
    
    console.log(`[NotificationOps] Successfully deleted notification setting ${id}`);
    return true;
  } catch (error) {
    console.error(`[NotificationOps] Error in deleteNotificationSetting for ID ${id}:`, error);
    return false;
  }
};

/**
 * Enhanced function to send a notification with better error handling and debugging options
 * @param id The ID of the notification setting to send
 * @returns Promise with boolean indicating success or failure
 */
export const sendNotification = async (id: string): Promise<boolean> => {
  console.log(`[NotificationOps] Sending notification ${id} with proper settings verification`);
  
  try {
    // Create options object with debugging flags
    const options = {
      id,
      useExistingDatabases: true,
      verifySettings: true,     // Add flag to verify settings before sending
      checkPeriod: true,        // Enable proper time period checking based on frequency
      fixEmailTemplate: true,   // Flag to ensure email template fixes are applied
      forceExactDateFilter: true // New flag to enforce exact yesterday date filtering
    };
    
    console.log('[NotificationOps] Sending notification with options:', options);
    
    const response = await fetch(`${API_URL}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationOps] Error sending notification: Status ${response.status} - ${response.statusText}`);
      console.error(`[NotificationOps] Error response body: ${errorText}`);
      throw new Error(`Error sending notification: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json();
    console.log(`[NotificationOps] Send notification response:`, data);
    return true;
  } catch (error) {
    console.error(`[NotificationOps] Error in sendNotification for ID ${id}:`, error);
    return false;
  }
};

// Debug utility function to help with troubleshooting notification issues
export const debugNotificationSetting = async (id: string): Promise<any> => {
  console.log(`[NotificationOps] Debugging notification setting ${id}`);
  
  try {
    // First get the notification setting
    const response = await fetch(`${API_URL}/notification-settings/${id}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationOps] Error fetching notification setting for debug: Status ${response.status} - ${response.statusText}`);
      console.error(`[NotificationOps] Error response body: ${errorText}`);
      throw new Error(`Error fetching notification setting: ${response.statusText} (${response.status})`);
    }
    
    const setting = await response.json();
    
    // Then get recent logs for this notification
    const logsResponse = await fetch(`${API_URL}/notification-logs?id=${id}`);
    let logs = [];
    
    if (logsResponse.ok) {
      logs = await logsResponse.json();
    } else {
      console.warn(`[NotificationOps] Could not fetch notification logs: ${logsResponse.statusText}`);
    }
    
    // Create debug report
    const debugReport = {
      setting,
      logs,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
    };
    
    console.log('[NotificationOps] Debug report:', debugReport);
    return debugReport;
  } catch (error) {
    console.error(`[NotificationOps] Error in debugNotificationSetting for ID ${id}:`, error);
    return null;
  }
};

// Export a named object that groups all notification operations for easier imports
export const notificationOperations = {
  getNotificationSettings,
  addNotificationSetting,
  updateNotificationSetting,
  deleteNotificationSetting,
  sendNotification,
  debugNotificationSetting
};
