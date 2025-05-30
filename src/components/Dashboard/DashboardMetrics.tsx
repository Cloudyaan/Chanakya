
import React from 'react';
import MetricsCard from './MetricsCard';
import { LicenseMetric } from '@/utils/types';

interface DashboardMetricsProps {
  metrics: LicenseMetric[];
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricsCard 
          key={metric.name} 
          metric={metric}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;
