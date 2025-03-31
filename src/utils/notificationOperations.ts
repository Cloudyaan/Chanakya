
import { API_URL } from './api';
import { NotificationSetting } from './types';
import { getTenantUpdates } from './messageCenterOperations';
import { getWindowsUpdates } from './windowsUpdatesOperations';
import { getM365News } from './m365NewsOperations';

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

// Function to send a notification immediately using real data
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

// Helper function to format data for email notifications
export const formatDataForEmail = async (tenant: string, updates_types: string[]): Promise<string> => {
  try {
    let emailContent = '<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">';
    emailContent += `<h1 style="color: #0078d4; padding-bottom: 10px; border-bottom: 1px solid #eaeaea;">Microsoft 365 Updates Summary</h1>`;
    
    for (const updateType of updates_types) {
      switch (updateType) {
        case 'message-center':
          const tenantUpdates = await getTenantUpdates(tenant);
          if (tenantUpdates && tenantUpdates.length > 0) {
            emailContent += `<h2 style="color: #0078d4; margin-top: 25px;">Message Center Updates</h2>`;
            emailContent += `<table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f0f0f0;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Title</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Category</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Published Date</th>
              </tr>`;
              
            tenantUpdates.slice(0, 10).forEach(update => {
              emailContent += `<tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${update.title}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${update.category || 'General'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(update.publishedDate).toLocaleDateString()}</td>
              </tr>`;
            });
            
            emailContent += `</table>`;
          } else {
            emailContent += `<h2 style="color: #0078d4; margin-top: 25px;">Message Center Updates</h2>`;
            emailContent += `<p>No recent updates from Message Center.</p>`;
          }
          break;
          
        case 'windows-updates':
          const windowsUpdates = await getWindowsUpdates(tenant);
          if (windowsUpdates && windowsUpdates.length > 0) {
            emailContent += `<h2 style="color: #0078d4; margin-top: 25px;">Windows Updates</h2>`;
            emailContent += `<table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f0f0f0;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Product</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Title</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Status</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Date</th>
              </tr>`;
              
            windowsUpdates.slice(0, 10).forEach(update => {
              emailContent += `<tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${update.productName || 'Unknown'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${update.title || 'No Title'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${update.status || 'Unknown'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${update.startDate ? new Date(update.startDate).toLocaleDateString() : 'N/A'}</td>
              </tr>`;
            });
            
            emailContent += `</table>`;
          } else {
            emailContent += `<h2 style="color: #0078d4; margin-top: 25px;">Windows Updates</h2>`;
            emailContent += `<p>No recent Windows updates.</p>`;
          }
          break;
          
        case 'm365-news':
          const newsItems = await getM365News(tenant);
          if (newsItems && newsItems.length > 0) {
            emailContent += `<h2 style="color: #0078d4; margin-top: 25px;">Microsoft 365 News</h2>`;
            emailContent += `<table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f0f0f0;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Title</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Published Date</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Categories</th>
              </tr>`;
              
            newsItems.slice(0, 10).forEach(news => {
              emailContent += `<tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <a href="${news.link}" style="color: #0078d4; text-decoration: none;" target="_blank">${news.title}</a>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(news.published_date).toLocaleDateString()}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${Array.isArray(news.categories) ? news.categories.join(', ') : ''}</td>
              </tr>`;
            });
            
            emailContent += `</table>`;
          } else {
            emailContent += `<h2 style="color: #0078d4; margin-top: 25px;">Microsoft 365 News</h2>`;
            emailContent += `<p>No recent Microsoft 365 news.</p>`;
          }
          break;
      }
    }
    
    emailContent += `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
      <p>This email was automatically generated by Microsoft 365 Updates Notification Service. Please do not reply to this email.</p>
    </div>`;
    
    emailContent += '</div>';
    return emailContent;
  } catch (error) {
    console.error('Error formatting email data:', error);
    return '<p>There was an error generating the email content. Please check the application logs.</p>';
  }
};
