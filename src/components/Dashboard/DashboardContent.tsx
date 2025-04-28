
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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        <TenantInfo 
          tenant={tenant} 
          className="lg:col-span-1"
          messageCenterCount={messageCenterUpdates.length}
          windowsUpdatesCount={windowsUpdates.length}
        />
      </div>
    </>
  );
};

export default DashboardContent;
