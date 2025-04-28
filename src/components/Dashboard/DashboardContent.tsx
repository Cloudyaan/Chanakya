
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import TenantInfo from './TenantInfo';
import UpdatesOverview from './UpdatesOverview';
import { Tenant } from '@/utils/types';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  const { 
    messageCenterUpdates,
    isLoading: messageIsLoading 
  } = useMessageCenterUpdates(tenant.tenantId);
  
  const { 
    windowsUpdates,
    isLoading: windowsIsLoading 
  } = useWindowsUpdates(tenant.tenantId);

  // Debug logging to check if data is being received
  useEffect(() => {
    console.log("Dashboard receiving message center updates:", messageCenterUpdates?.length || 0);
    console.log("Dashboard receiving windows updates:", windowsUpdates?.length || 0);
  }, [messageCenterUpdates, windowsUpdates]);

  return (
    <div className="space-y-6">
      {/* Enhanced Tenant Info Card with all update information */}
      <TenantInfo 
        tenant={tenant}
        messageCenterUpdates={messageCenterUpdates}
        windowsUpdates={windowsUpdates}
      />
      
      {/* Detailed breakdown section below */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Detailed Updates Breakdown</h2>
        <UpdatesOverview 
          messageCenterUpdates={messageCenterUpdates} 
          windowsUpdates={windowsUpdates}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
