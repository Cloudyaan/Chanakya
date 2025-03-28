
import React from 'react';

interface EmptyStateProps {
  onRefresh: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh }) => {
  return (
    <div className="p-8 text-center border border-dashed rounded-lg">
      <h2 className="text-xl text-gray-500 mb-2">No License Data Available</h2>
      <p className="text-gray-400 mb-4">Run the <code>fetch_licenses.py</code> script to retrieve license data from Microsoft Graph API.</p>
      <button 
        onClick={onRefresh}
        className="px-4 py-2 border border-border rounded-md text-sm font-medium bg-background hover:bg-muted transition-colors"
      >
        Try Again
      </button>
    </div>
  );
};

export default EmptyState;
