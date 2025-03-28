
import React from 'react';
import { Button } from '@/components/ui/button';

const NoTenantsMessage = () => {
  return (
    <div className="p-8 text-center border border-dashed rounded-lg">
      <h2 className="text-xl text-gray-500 mb-2">No Active Tenants</h2>
      <p className="text-gray-400 mb-4">Please add and activate at least one Microsoft 365 tenant in Settings.</p>
      <Button variant="outline" onClick={() => window.location.href = '/settings'}>
        Go to Settings
      </Button>
    </div>
  );
};

export default NoTenantsMessage;
