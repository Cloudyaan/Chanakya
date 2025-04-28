
import React from 'react';
import { Tenant } from '@/utils/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageSquare, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  windowsUpdatesCount = 0,
}) => {
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
        "bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg border border-gray-100",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {tenant.name}
            </h2>
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              ID: {tenant.tenantId}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{tenant.domain || `${tenant.name}.onmicrosoft.com`}</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          statusColor()
        )}>
          {tenant.subscriptionStatus}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          to="/microsoft-365/updates?tab=message-center"
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-800">Message Center Updates</h3>
          </div>
          <div className="text-2xl font-semibold text-gray-900 pl-2">{messageCenterCount}</div>
        </Link>
        
        <Link 
          to="/microsoft-365/updates?tab=windows-updates"
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Monitor className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-800">Windows Updates</h3>
          </div>
          <div className="text-2xl font-semibold text-gray-900 pl-2">{windowsUpdatesCount}</div>
        </Link>
      </div>
    </motion.div>
  );
};

export default TenantInfo;

