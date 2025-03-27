
import { License, Tenant, LicenseMetric, LicenseDistribution } from './types';

export const tenant: Tenant = {
  id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  name: 'Contoso Corporation',
  domain: 'contoso.onmicrosoft.com',
  countryCode: 'US',
  subscriptionStatus: 'Active',
  adminEmail: 'admin@contoso.onmicrosoft.com',
  creationDate: '2021-01-15T00:00:00Z',
  totalUsers: 256,
  activeUsers: 243
};

export const licenses: License[] = [
  {
    id: '1',
    name: 'Microsoft 365 E5',
    displayName: 'Microsoft 365 E5',
    description: 'Premium Office apps, advanced security, and compliance',
    totalCount: 100,
    usedCount: 87,
    availableCount: 13,
    sku: 'CFQ7TTC0LDPB:0001',
    price: 57,
    currency: 'USD',
    renewalDate: '2024-12-31T00:00:00Z',
    includedServices: ['Exchange Online', 'SharePoint Online', 'Teams', 'Power BI Pro', 'Windows 11 Enterprise', 'Advanced Threat Protection']
  },
  {
    id: '2',
    name: 'Microsoft 365 E3',
    displayName: 'Microsoft 365 E3',
    description: 'Office apps, email and calendar, meetings, and more',
    totalCount: 150,
    usedCount: 142,
    availableCount: 8,
    sku: 'CFQ7TTC0LDPB:0002',
    price: 36,
    currency: 'USD',
    renewalDate: '2024-12-31T00:00:00Z',
    includedServices: ['Exchange Online', 'SharePoint Online', 'Teams', 'Windows 11 Enterprise']
  },
  {
    id: '3',
    name: 'Exchange Online (Plan 2)',
    displayName: 'Exchange Online Plan 2',
    description: 'Email and calendar with advanced features',
    totalCount: 50,
    usedCount: 32,
    availableCount: 18,
    sku: 'CFQ7TTC0LDPB:0003',
    price: 8,
    currency: 'USD',
    renewalDate: '2024-10-15T00:00:00Z',
    includedServices: ['Exchange Online']
  },
  {
    id: '4',
    name: 'Microsoft 365 Business Basic',
    displayName: 'Microsoft 365 Business Basic',
    description: 'Business email, cloud file storage, online meetings, and more',
    totalCount: 75,
    usedCount: 68,
    availableCount: 7,
    sku: 'CFQ7TTC0LDPB:0004',
    price: 6,
    currency: 'USD',
    renewalDate: '2024-11-30T00:00:00Z',
    includedServices: ['Exchange Online', 'SharePoint Online', 'Teams']
  },
  {
    id: '5',
    name: 'Microsoft Power BI Pro',
    displayName: 'Power BI Pro',
    description: 'Self-service analytics tools for visualization and insights',
    totalCount: 25,
    usedCount: 18,
    availableCount: 7,
    sku: 'CFQ7TTC0LDPB:0005',
    price: 10,
    currency: 'USD',
    renewalDate: '2025-01-15T00:00:00Z',
    includedServices: ['Power BI']
  }
];

export const metrics: LicenseMetric[] = [
  {
    name: 'Total Licenses',
    value: 400,
    previousValue: 385,
    change: 3.9,
    changeType: 'increase'
  },
  {
    name: 'Assigned',
    value: 347,
    previousValue: 330,
    change: 5.2,
    changeType: 'increase'
  },
  {
    name: 'Available',
    value: 53,
    previousValue: 55,
    change: 3.6,
    changeType: 'decrease'
  },
  {
    name: 'Utilization Rate',
    value: 86.8,
    previousValue: 85.7,
    change: 1.3,
    changeType: 'increase'
  }
];

export const licenseDistribution: LicenseDistribution[] = [
  { name: 'Microsoft 365 E5', count: 87, color: '#4472C4' },
  { name: 'Microsoft 365 E3', count: 142, color: '#70AD47' },
  { name: 'Exchange Online (Plan 2)', count: 32, color: '#ED7D31' },
  { name: 'Microsoft 365 Business Basic', count: 68, color: '#5B9BD5' },
  { name: 'Microsoft Power BI Pro', count: 18, color: '#FFC000' }
];

export const monthlyTrend = [
  { month: 'Jan', licenses: 340 },
  { month: 'Feb', licenses: 345 },
  { month: 'Mar', licenses: 345 },
  { month: 'Apr', licenses: 350 },
  { month: 'May', licenses: 355 },
  { month: 'Jun', licenses: 360 },
  { month: 'Jul', licenses: 370 },
  { month: 'Aug', licenses: 375 },
  { month: 'Sep', licenses: 380 },
  { month: 'Oct', licenses: 385 },
  { month: 'Nov', licenses: 390 },
  { month: 'Dec', licenses: 400 }
];

export const licenseUtilization = [
  { name: 'Microsoft 365 E5', utilization: 87 },
  { name: 'Microsoft 365 E3', utilization: 95 },
  { name: 'Exchange Online (Plan 2)', utilization: 64 },
  { name: 'Microsoft 365 Business Basic', utilization: 91 },
  { name: 'Microsoft Power BI Pro', utilization: 72 }
];
