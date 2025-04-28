
import React from 'react';
import { motion } from 'framer-motion';
import TenantInfo from './TenantInfo';
import { Tenant } from '@/utils/types';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  const { messageCenterUpdates } = useMessageCenterUpdates(tenant.tenantId);
  const { windowsUpdates } = useWindowsUpdates(tenant.tenantId);

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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        <TenantInfo 
          tenant={tenant} 
          className="lg:col-span-1"
          messageCenterCount={messageCenterUpdates.length}
          windowsUpdatesCount={windowsUpdates.length}
          messageCenterUpdates={{
            informational: informationalUpdates,
            planForChange: planForChangeUpdates,
            actionRequired: actionRequiredUpdates
          }}
          windowsUpdates={{
            active: activeWindowsIssues,
            resolved: resolvedWindowsIssues
          }}
        />
      </div>
    </>
  );
};

export default DashboardContent;
