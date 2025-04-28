
import React from 'react';
import { Tenant } from '@/utils/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageSquare, Monitor } from 'lucide-react';

interface TenantInfoProps {
  tenant: Tenant;
  className?: string;
  messageCenterCount?: number;
  windowsUpdatesCount?: number;
}

const TenantInfo: React.FC<TenantInfoProps> = ({ 
  tenant, 
  className,
  messageCenterCount = 0,
  windowsUpdatesCount = 0
}) => {
  const statusColor = () => {
    switch (tenant.subscriptionStatus) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Warning': return 'bg-yellow-100 text-yellow-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Format domain name if not present
  const domainName = tenant.domain || `${tenant.name}.onmicrosoft.com`;

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
          <p className="text-sm text-m365-gray-500">{domainName}</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          statusColor()
        )}>
          {tenant.subscriptionStatus}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-full">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-m365-gray-500">Message Center Updates</p>
            <p className="text-lg font-semibold">{messageCenterCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 bg-purple-100 rounded-full">
            <Monitor className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-m365-gray-500">Windows Updates</p>
            <p className="text-lg font-semibold">{windowsUpdatesCount}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TenantInfo;
