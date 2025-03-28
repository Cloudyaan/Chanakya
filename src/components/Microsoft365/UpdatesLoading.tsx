
import React from 'react';
import { RefreshCw } from 'lucide-react';

const UpdatesLoading = () => {
  return (
    <div className="p-12 flex justify-center">
      <div className="flex flex-col items-center">
        <RefreshCw size={40} className="animate-spin text-m365-600 mb-4" />
        <p className="text-m365-gray-500">Loading updates...</p>
      </div>
    </div>
  );
};

export default UpdatesLoading;
