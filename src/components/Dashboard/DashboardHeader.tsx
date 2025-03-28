
import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isLoading, onRefresh }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex flex-wrap justify-between items-center"
    >
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-m365-gray-500">Overview of Microsoft M365 Tenant</p>
      </div>
      
      <div className="flex items-center gap-3 mt-2 sm:mt-0">
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1.5 border border-border rounded-md text-sm font-medium bg-background hover:bg-muted transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
          Refresh
        </button>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
