
import React from 'react';
import { M365News } from '@/utils/types';
import M365NewsTable from './M365NewsTable';

interface M365NewsContentProps {
  isLoading: boolean;
  newsItems: M365News[];
  isFetching: boolean;
  onFetch: () => void;
}

const M365NewsContent = ({
  isLoading,
  newsItems,
  isFetching,
  onFetch
}: M365NewsContentProps) => {
  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <M365NewsTable 
      news={newsItems}
      isFetching={isFetching}
      onFetch={onFetch}
    />
  );
};

export default M365NewsContent;
