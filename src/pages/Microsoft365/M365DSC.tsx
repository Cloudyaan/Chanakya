
import React from 'react';
import Microsoft365 from '../Microsoft365';

const M365DSC = () => {
  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">M365 DSC</h1>
          <p className="text-m365-gray-500">Microsoft 365 Desired State Configuration</p>
        </div>
        
        <div className="p-8 text-center border border-dashed rounded-lg">
          <h2 className="text-xl text-gray-500 mb-2">Coming Soon</h2>
          <p className="text-gray-400">M365 DSC features will be available in a future update.</p>
        </div>
      </main>
    </Microsoft365>
  );
};

export default M365DSC;
