
import React from 'react';
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
  const { messageCenterUpdates } = useMessageCenterUpdates(tenant.tenantId);
  const { windowsUpdates } = useWindowsUpdates(tenant.tenantId);

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
