
import React from 'react';
import { Tenant, TenantUpdate, WindowsUpdate } from '@/utils/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageSquare, Monitor, BellRing, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface TenantInfoProps {
  tenant: Tenant;
  className?: string;
  messageCenterUpdates?: TenantUpdate[];
  windowsUpdates?: WindowsUpdate[];
}

const TenantInfo: React.FC<TenantInfoProps> = ({ 
  tenant, 
  className,
  messageCenterUpdates = [],
  windowsUpdates = [],
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

  // Count Message Center updates by type
  const informationalUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Informational' || 
    (!u.actionType && u.severity === 'Normal')
  ).length;
  
  const planForChangeUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Plan for Change' ||
    u.actionType === 'planForChange' ||
    (!u.actionType && u.severity === 'Medium')
  ).length;
  
  const actionRequiredUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Action Required' ||
    (!u.actionType && u.severity === 'High')
  ).length;
  
  // Count Windows updates by status
  const activeWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'active' || 
    u.status?.toLowerCase() === 'investigating' ||
    u.status?.toLowerCase() === 'confirmed'
  ).length;
  
  const resolvedWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'resolved' || 
    u.status?.toLowerCase() === 'completed'
  ).length;

  // Log actual counts for debugging
  console.log('Message Center Updates:', messageCenterUpdates.length);
  console.log('Windows Updates:', windowsUpdates.length);
  console.log('Informational:', informationalUpdates);
  console.log('Plan for Change:', planForChangeUpdates);
  console.log('Action Required:', actionRequiredUpdates);
  console.log('Active Windows:', activeWindowsIssues);
  console.log('Resolved Windows:', resolvedWindowsIssues);

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
      <div className="flex justify-between items-start mb-6">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Message Center Updates Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium">Message Center Updates</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">{messageCenterUpdates.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-amber-50 rounded-lg shadow-sm">
              <div className="flex items-center gap-1">
                <BellRing className="h-4 w-4 text-amber-600" />
                <span className="text-lg font-medium text-amber-600">{planForChangeUpdates}</span>
              </div>
              <div className="text-xs text-amber-600 mt-1">Plan for Change</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg shadow-sm">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-lg font-medium text-red-600">{actionRequiredUpdates}</span>
              </div>
              <div className="text-xs text-red-600 mt-1">Action Required</div>
            </div>
          </div>
        </div>
        
        {/* Windows Updates Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <Monitor className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium">Windows Updates</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-1">{windowsUpdates.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-amber-50 rounded-lg shadow-sm">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-lg font-medium text-amber-600">{activeWindowsIssues}</span>
              </div>
              <div className="text-xs text-amber-600 mt-1">Active</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg shadow-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-lg font-medium text-green-600">{resolvedWindowsIssues}</span>
              </div>
              <div className="text-xs text-green-600 mt-1">Resolved</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TenantInfo;
