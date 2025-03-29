
// Mock data for tenant information
export const tenant = {
  name: "Contoso Ltd",
  domain: "contoso.onmicrosoft.com",
  activationDate: "2022-01-15",
  licenseCount: 250,
  contactEmail: "admin@contoso.com"
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
