
import React from 'react';
import { Tenant } from '@/utils/types';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import DashboardOverview from './DashboardOverview';
import MessageCenterSection from './MessageCenterSection';
import WindowsUpdatesSection from './WindowsUpdatesSection';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  const { 
    messageCenterUpdates,
    actionRequiredUpdates,
    planForChangeUpdates,
    informationalUpdates,
    isLoading: messageIsLoading 
  } = useMessageCenterUpdates(tenant.tenantId);
  
  const { 
    windowsUpdates,
    isLoading: windowsIsLoading 
  } = useWindowsUpdates(tenant.tenantId);

  // Get active Windows issues
  const activeWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'active' || 
    u.status?.toLowerCase() === 'investigating' || 
    u.status?.toLowerCase() === 'confirmed'
  );

  const resolvedWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'resolved' || 
    u.status?.toLowerCase() === 'completed'
  );

  // Show loading state if either data is loading
  if (messageIsLoading || windowsIsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <DashboardOverview 
        tenant={tenant}
        totalMessageCenterUpdates={messageCenterUpdates.length}
        totalWindowsUpdates={windowsUpdates.length}
      />
      
      <MessageCenterSection 
        actionRequiredUpdates={actionRequiredUpdates}
        planForChangeUpdates={planForChangeUpdates}
        informationalUpdates={informationalUpdates}
      />
      
      <WindowsUpdatesSection 
        activeWindowsIssues={activeWindowsIssues}
        resolvedWindowsIssues={resolvedWindowsIssues}
      />
    </div>
  );
};

export default DashboardContent;
