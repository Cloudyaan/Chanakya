
import React from 'react';
import { motion } from 'framer-motion';
import TenantInfo from './TenantInfo';
import { Tenant } from '@/utils/types';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        <TenantInfo tenant={tenant} className="lg:col-span-1" />
      </div>
    </>
  );
};

export default DashboardContent;
