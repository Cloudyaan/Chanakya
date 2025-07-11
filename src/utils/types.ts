
export interface License {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  totalCount: number;
  usedCount: number;
  availableCount: number;
  sku: string;
  price?: number;
  currency?: string;
  renewalDate?: string;
  includedServices?: string[];
  tenantId?: string;
  tenantName?: string;
}

export interface Tenant {
  id: string;
  tenantId: string; // Added tenantId property
  name: string;
  domain: string;
  countryCode: string;
  subscriptionStatus: 'Active' | 'Expired' | 'Warning';
  adminEmail: string;
  creationDate: string;
  totalUsers: number;
  activeUsers: number;
}

export interface TenantConfig {
  id: string;
  name: string;
  tenantId: string;
  applicationId: string;
  applicationSecret: string;
  isActive: boolean;
  dateAdded: string;
  // Updated scheduling configuration
  autoFetchEnabled?: boolean;
  scheduleValue?: number; // The numeric value (e.g., 2 for "every 2 hours")
  scheduleUnit?: 'hours' | 'days'; // The unit (hours or days)
}

export interface LicenseMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export interface LicenseDistribution {
  name: string;
  count: number;
  color: string;
}

export interface AzureConfig {
  id: string;
  name: string;
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  isActive: boolean;
  dateAdded: string;
}

export interface TenantUpdate {
  id: string;
  tenantId: string;
  tenantName?: string;
  title: string;
  messageId: string;
  description: string;
  category: string;
  severity?: 'High' | 'Medium' | 'Low' | 'Normal';
  actionType?: 'Action Required' | 'Plan for Change' | 'Informational' | 'planForChange';
  publishedDate: string;
  lastModifiedDate?: string;
  isRead?: boolean;
}

export interface WindowsUpdate {
  id: string;
  tenantId: string;
  productId: string;
  productName: string | null;
  title: string | null;
  description: string | null;
  webViewUrl: string | null;
  status: string | null;
  startDate: string | null;
  resolvedDate: string | null;
}

export interface M365News {
  id: string;
  tenantId: string;
  tenantName?: string;
  title: string;
  published_date: string;
  link: string;
  summary: string;
  categories: string[];
  fetch_date: string;
}

export interface NotificationSetting {
  id: string;
  name: string;
  email: string;
  tenants: string[];
  update_types: string[];
  frequency: 'Daily' | 'Weekly';
  created_at: string;
  updated_at: string;
}
