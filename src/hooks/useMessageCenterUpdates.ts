
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
      const result = await getTenantUpdates(tenantId);
      console.log(`Retrieved ${result.length} message center updates`);
      return result;
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

  // Group updates by type for easy access
  const informationalUpdates = regularUpdates.filter(u => 
    u.actionType === 'Informational' || 
    (!u.actionType && u.severity === 'Normal')
  );

  const planForChangeUpdates = regularUpdates.filter(u => 
    u.actionType === 'Plan for Change' || 
    u.actionType === 'planForChange' || 
    (!u.actionType && u.severity === 'Medium')
  );

  const actionRequiredUpdates = regularUpdates.filter(u => 
    u.actionType === 'Action Required' || 
    (!u.actionType && u.severity === 'High')
  );

  useEffect(() => {
    console.log("useMessageCenterUpdates hook - received updates:", regularUpdates.length);
    console.log("Informational updates:", informationalUpdates.length);
    console.log("Plan for Change updates:", planForChangeUpdates.length);
    console.log("Action Required updates:", actionRequiredUpdates.length);
  }, [regularUpdates.length, informationalUpdates.length, planForChangeUpdates.length, actionRequiredUpdates.length]);

  return {
    messageCenterUpdates: regularUpdates,
    informationalUpdates,
    planForChangeUpdates,
    actionRequiredUpdates,
    isLoading,
    error,
    refreshData
  };
};
