
import React from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import LicenseTable from '@/components/LicenseTable/LicenseTable';
import { licenses } from '@/utils/mockData';

const Licenses = () => {
  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">License Management</h1>
          <p className="text-m365-gray-500">View and manage all Microsoft 365 licenses</p>
        </motion.div>
        
        <div className="mb-8">
          <LicenseTable licenses={licenses} />
        </div>
      </main>
    </Microsoft365>
  );
};

export default Licenses;
