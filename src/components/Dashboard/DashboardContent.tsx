
import React from 'react';
import { motion } from 'framer-motion';
import TenantInfo from './TenantInfo';
import LicenseChart from './LicenseChart';
import LicenseOverview from './LicenseOverview';
import { Tenant, License, LicenseDistribution } from '@/utils/types';

interface DashboardContentProps {
  tenant: Tenant;
  licenses: License[];
  licenseDistribution: LicenseDistribution[];
}

const DashboardContent: React.FC<DashboardContentProps> = ({ 
  tenant, 
  licenses, 
  licenseDistribution 
}) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <TenantInfo tenant={tenant} className="lg:col-span-1" />
        {licenseDistribution.length > 0 && (
          <LicenseChart data={licenseDistribution} className="lg:col-span-2" />
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {licenses.length > 0 && (
          <LicenseOverview licenses={licenses} className="lg:col-span-3" />
        )}
      </div>
    </>
  );
};

export default DashboardContent;
