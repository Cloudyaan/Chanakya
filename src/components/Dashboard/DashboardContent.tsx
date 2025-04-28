
import React from 'react';
import TenantInfo from './TenantInfo';
import UpdatesOverview from './UpdatesOverview';
import { Tenant } from '@/utils/types';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  const { messageCenterUpdates } = useMessageCenterUpdates(tenant.tenantId);
  const { windowsUpdates } = useWindowsUpdates(tenant.tenantId);

  return (
    <div className="space-y-6">
      {/* Top Card - Total Updates */}
      <TenantInfo 
        tenant={tenant}
        messageCenterCount={messageCenterUpdates.length}
        windowsUpdatesCount={windowsUpdates.length}
      />
      
      {/* Detailed Updates Overview Card */}
      <UpdatesOverview 
        messageCenterUpdates={messageCenterUpdates} 
        windowsUpdates={windowsUpdates}
      />
    </div>
  );
};

export default DashboardContent;
