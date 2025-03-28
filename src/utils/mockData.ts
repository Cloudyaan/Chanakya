
import { TenantUpdate } from './types';

// Generate mock updates for demonstration
export const generateMockUpdates = (tenantId?: string): TenantUpdate[] => {
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
export const generateMockUpdatesWithMsalError = (tenantId?: string): TenantUpdate[] => {
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
export const generateMockUpdatesWithDatabaseMessage = (tenantId?: string, message?: string): TenantUpdate[] => {
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
