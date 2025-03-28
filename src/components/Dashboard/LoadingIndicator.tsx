
import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <RefreshCw size={40} className="animate-spin text-m365-600" />
    </div>
  );
};

export default LoadingIndicator;
