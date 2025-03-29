
// Mock data for tenant information
export const tenant = {
  id: "tenant-001",
  name: "Contoso Ltd",
  domain: "contoso.onmicrosoft.com",
  countryCode: "US",
  subscriptionStatus: "Active" as const,
  adminEmail: "admin@contoso.com",
  creationDate: "2022-01-15",
  totalUsers: 250,
  activeUsers: 230
};

// Mock data for monthly license trend chart
export const monthlyTrend = [
  { month: "Jan", licenses: 150 },
  { month: "Feb", licenses: 175 },
  { month: "Mar", licenses: 200 },
  { month: "Apr", licenses: 210 },
  { month: "May", licenses: 225 },
  { month: "Jun", licenses: 240 },
  { month: "Jul", licenses: 250 },
  { month: "Aug", licenses: 250 },
];

// Mock data for license utilization chart
export const licenseUtilization = [
  { name: "Microsoft 365 E3", utilization: 95 },
  { name: "Microsoft 365 E5", utilization: 87 },
  { name: "Exchange Online", utilization: 100 },
  { name: "Power BI Pro", utilization: 72 },
  { name: "Office 365 F3", utilization: 53 },
];
