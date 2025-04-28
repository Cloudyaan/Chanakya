
import React from 'react';
import { Tenant } from '@/utils/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageSquare, Monitor, BellRing, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface TenantInfoProps {
  tenant: Tenant;
  className?: string;
  messageCenterCount?: number;
  windowsUpdatesCount?: number;
  messageCenterUpdates?: {
    informational: number;
    planForChange: number;
    actionRequired: number;
  };
  windowsUpdates?: {
    active: number;
    resolved: number;
  };
}

const TenantInfo: React.FC<TenantInfoProps> = ({ 
  tenant, 
  className,
  messageCenterCount = 0,
  windowsUpdatesCount = 0,
  messageCenterUpdates = { informational: 0, planForChange: 0, actionRequired: 0 },
  windowsUpdates = { active: 0, resolved: 0 }
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Message Center Updates Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium">Message Center Updates ({messageCenterCount})</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center bg-white p-2 rounded shadow-sm">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Clock className="h-3 w-3" />
                <span>Info</span>
              </div>
              <span className="text-lg font-semibold">{messageCenterUpdates.informational}</span>
            </div>
            
            <div className="flex flex-col items-center bg-white p-2 rounded shadow-sm">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <BellRing className="h-3 w-3" />
                <span>Plan</span>
              </div>
              <span className="text-lg font-semibold">{messageCenterUpdates.planForChange}</span>
            </div>
            
            <div className="flex flex-col items-center bg-white p-2 rounded shadow-sm">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <AlertCircle className="h-3 w-3" />
                <span>Action</span>
              </div>
              <span className="text-lg font-semibold">{messageCenterUpdates.actionRequired}</span>
            </div>
          </div>
        </div>
        
        {/* Windows Updates Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Monitor className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium">Windows Updates ({windowsUpdatesCount})</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center bg-white p-2 rounded shadow-sm">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <AlertCircle className="h-3 w-3" />
                <span>Active</span>
              </div>
              <span className="text-lg font-semibold">{windowsUpdates.active}</span>
            </div>
            
            <div className="flex flex-col items-center bg-white p-2 rounded shadow-sm">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <CheckCircle className="h-3 w-3" />
                <span>Resolved</span>
              </div>
              <span className="text-lg font-semibold">{windowsUpdates.resolved}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TenantInfo;
