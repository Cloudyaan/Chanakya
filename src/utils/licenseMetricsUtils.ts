
import { License, LicenseMetric, LicenseDistribution } from './types';

/**
 * Calculates license metrics based on license data
 * @param licenseData Array of license objects
 * @returns Array of license metrics
 */
export const calculateLicenseMetrics = (licenseData: License[]): LicenseMetric[] => {
  // Calculate totals from license data
  const totalLicenses = licenseData.reduce((sum, license) => sum + license.totalCount, 0);
  const usedLicenses = licenseData.reduce((sum, license) => sum + license.usedCount, 0);
  const availableLicenses = licenseData.reduce((sum, license) => sum + license.availableCount, 0);
  const utilRate = totalLicenses > 0 ? Math.round((usedLicenses / totalLicenses) * 100) : 0;
  
  // Create metrics with simulated previous values
  return [
    {
      name: "Total Licenses",
      value: totalLicenses,
      previousValue: totalLicenses - 10, // Simulated previous value
      change: 3,
      changeType: "increase"
    },
    {
      name: "Assigned Licenses",
      value: usedLicenses,
      previousValue: usedLicenses - 5, // Simulated previous value
      change: 2,
      changeType: "increase"
    },
    {
      name: "Available Licenses",
      value: availableLicenses,
      previousValue: availableLicenses + 5, // Simulated previous value
      change: 8,
      changeType: "decrease"
    },
    {
      name: "Utilization Rate",
      value: utilRate,
      previousValue: utilRate - 1, // Simulated previous value
      change: 1,
      changeType: "increase"
    }
  ];
};

/**
 * Creates license distribution data for visualization
 * @param licenseData Array of license objects
 * @returns Array of license distribution objects
 */
export const createLicenseDistribution = (licenseData: License[]): LicenseDistribution[] => {
  const colors = ["#4f46e5", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63"];
  
  // Sort licenses by used count (descending) and take top 5
  const sortedLicenses = [...licenseData].sort((a, b) => b.usedCount - a.usedCount);
  const topLicenses = sortedLicenses.slice(0, 5);
  
  // Calculate "Others" category if there are more than 5 licenses
  let othersCount = 0;
  if (sortedLicenses.length > 5) {
    othersCount = sortedLicenses.slice(5).reduce((sum, license) => sum + license.usedCount, 0);
  }
  
  // Create distribution data array
  const distribution = topLicenses.map((license, index) => ({
    name: license.displayName,
    count: license.usedCount,
    color: colors[index % colors.length]
  }));
  
  // Add "Others" category if applicable
  if (othersCount > 0) {
    distribution.push({
      name: "Others",
      count: othersCount,
      color: colors[5]
    });
  }
  
  return distribution;
};
