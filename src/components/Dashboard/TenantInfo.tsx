
import React from 'react';
import { Tenant } from '@/utils/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TenantInfoProps {
  tenant: Tenant;
  className?: string;
}

const TenantInfo: React.FC<TenantInfoProps> = ({ tenant, className }) => {
  const statusColor = () => {
    switch (tenant.subscriptionStatus) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Warning': return 'bg-yellow-100 text-yellow-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div 
      className={cn(
        "bg-white rounded-xl p-6 shadow-soft border border-border",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{tenant.name}</h2>
          <p className="text-sm text-m365-gray-500">{tenant.domain}</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          statusColor()
        )}>
          {tenant.subscriptionStatus}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-m365-gray-500">Admin Contact</p>
          <p className="text-sm font-medium">{tenant.adminEmail}</p>
        </div>
        <div>
          <p className="text-sm text-m365-gray-500">Country</p>
          <p className="text-sm font-medium">{tenant.countryCode}</p>
        </div>
        <div>
          <p className="text-sm text-m365-gray-500">Total Users</p>
          <p className="text-sm font-medium">{tenant.totalUsers}</p>
        </div>
        <div>
          <p className="text-sm text-m365-gray-500">Active Users</p>
          <p className="text-sm font-medium">{tenant.activeUsers}</p>
        </div>
        <div>
          <p className="text-sm text-m365-gray-500">Creation Date</p>
          <p className="text-sm font-medium">{new Date(tenant.creationDate).toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TenantInfo;
