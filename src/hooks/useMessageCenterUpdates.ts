
import { useState, useEffect } from 'react';
import { TenantUpdate } from '@/utils/types';
import { getTenantUpdates } from '@/utils/messageCenterOperations';
import { useQuery } from '@tanstack/react-query';

export const useMessageCenterUpdates = (tenantId: string | null) => {
  const {
    data: updates = [],
    isLoading,
    error,
    refetch: refreshData
  } = useQuery<TenantUpdate[]>({
    queryKey: ['message-center-updates', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      console.log(`Fetching message center updates for dashboard: ${tenantId}`);
      // Get all updates without limit
      return await getTenantUpdates(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter out system messages and log for debugging
  const regularUpdates = updates.filter(u => 
    u.id !== 'db-init' && 
    u.id !== 'msal-error' && 
    u.tenantName !== 'System Message'
  );

  useEffect(() => {
    console.log("useMessageCenterUpdates hook - received updates:", regularUpdates.length);
  }, [regularUpdates.length]);

  return {
    messageCenterUpdates: regularUpdates,
    isLoading,
    error,
    refreshData
  };
};
