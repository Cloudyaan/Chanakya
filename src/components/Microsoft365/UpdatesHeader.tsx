
import React from 'react';

interface UpdatesHeaderProps {
  selectedTenant: string | null;
}

const UpdatesHeader = ({ 
  selectedTenant
}: UpdatesHeaderProps) => {
  return (
    <div className="flex items-center gap-3 mt-2 sm:mt-0">
      {/* All buttons removed as requested */}
    </div>
  );
};

export default UpdatesHeader;
