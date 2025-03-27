
import React from 'react';
import { LicenseMetric } from '@/utils/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MetricsCardProps {
  metric: LicenseMetric;
  className?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ metric, className }) => {
  const getChangeColor = () => {
    if (metric.changeType === 'increase') return 'text-green-600';
    if (metric.changeType === 'decrease') return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = () => {
    if (metric.changeType === 'increase') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
        </svg>
      );
    }
    if (metric.changeType === 'decrease') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.768a.75.75 0 011.113.07 20.905 20.905 0 005.5 5.5.75.75 0 01.07 1.114L13.682 17a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06l3.75-3.75-2.37-2.37L1.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className={cn(
        "bg-white rounded-xl p-6 shadow-soft border border-border flex flex-col premium-transition hover:shadow-card",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -3 }}
    >
      <p className="text-m365-gray-500 text-sm">{metric.name}</p>
      
      <div className="mt-2 flex items-baseline">
        <h3 className="text-3xl font-semibold text-foreground">{metric.name.includes('Rate') ? `${metric.value}%` : metric.value}</h3>
        
        {metric.change && (
          <div className={cn("flex items-center ml-3 text-xs font-medium", getChangeColor())}>
            <span className="mr-0.5">{getChangeIcon()}</span>
            <span>{metric.change}%</span>
          </div>
        )}
      </div>
      
      {metric.previousValue && (
        <div className="mt-1">
          <p className="text-xs text-m365-gray-400">
            Previous: {metric.name.includes('Rate') ? `${metric.previousValue}%` : metric.previousValue}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MetricsCard;
