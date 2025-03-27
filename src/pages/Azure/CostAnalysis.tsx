
import React from 'react';
import Azure from '../Azure';

const CostAnalysis = () => {
  return (
    <Azure>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Cost Analysis</h1>
          <p className="text-m365-gray-500">Monitor and manage your Azure costs</p>
        </div>
        
        <div className="p-8 text-center border border-dashed rounded-lg">
          <h2 className="text-xl text-gray-500 mb-2">Coming Soon</h2>
          <p className="text-gray-400">Azure Cost Analysis features will be available in a future update.</p>
        </div>
      </main>
    </Azure>
  );
};

export default CostAnalysis;
