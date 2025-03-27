
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
}

export interface Tenant {
  id: string;
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
