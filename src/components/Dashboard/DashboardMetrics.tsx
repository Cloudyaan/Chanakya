
import React from 'react';
import { motion } from 'framer-motion';
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
          className={`animation-delay-${index * 100}`}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;
