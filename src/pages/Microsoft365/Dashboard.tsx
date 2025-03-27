
import React from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import MetricsCard from '@/components/Dashboard/MetricsCard';
import TenantInfo from '@/components/Dashboard/TenantInfo';
import LicenseChart from '@/components/Dashboard/LicenseChart';
import LicenseOverview from '@/components/Dashboard/LicenseOverview';
import { tenant, licenses, metrics, licenseDistribution } from '@/utils/mockData';

const Dashboard = () => {
  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">License Dashboard</h1>
          <p className="text-m365-gray-500">Monitor and manage your Microsoft 365 licenses</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricsCard 
              key={metric.name} 
              metric={metric} 
              className={`animation-delay-${index * 100}`}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TenantInfo tenant={tenant} className="lg:col-span-1" />
          <LicenseChart data={licenseDistribution} className="lg:col-span-2" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LicenseOverview licenses={licenses} className="lg:col-span-3" />
        </div>
      </main>
    </Microsoft365>
  );
};

export default Dashboard;
