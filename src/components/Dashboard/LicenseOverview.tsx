
import React from 'react';
import { License } from '@/utils/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LicenseOverviewProps {
  licenses: License[];
  className?: string;
}

const LicenseOverview: React.FC<LicenseOverviewProps> = ({ licenses, className }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const sortedLicenses = [...licenses].sort((a, b) => b.usedCount - a.usedCount);
  const topLicenses = sortedLicenses.slice(0, 3);

  return (
    <motion.div 
      className={cn(
        "bg-white rounded-xl p-6 shadow-soft border border-border",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">License Overview</h3>
        <a href="/licenses" className="text-sm text-m365-600 hover:text-m365-700 premium-transition">View All</a>
      </div>
      
      <motion.div 
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {topLicenses.map((license) => {
          const utilization = (license.usedCount / license.totalCount) * 100;
          
          return (
            <motion.div key={license.id} className="premium-transition" variants={item}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-foreground">{license.displayName}</h4>
                <span className="text-xs text-m365-gray-500">
                  {license.usedCount} / {license.totalCount}
                </span>
              </div>
              
              <div className="h-2 bg-m365-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-m365-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${utilization}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-m365-gray-500">
                  Available: <span className="font-medium">{license.availableCount}</span>
                </p>
                <p className={cn(
                  "text-xs font-medium",
                  utilization > 90 ? "text-amber-600" : "text-green-600"
                )}>
                  {utilization.toFixed(1)}% Utilized
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default LicenseOverview;
