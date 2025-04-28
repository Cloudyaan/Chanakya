
import { useState, useEffect } from 'react';
import { getTenantUpdates, fetchTenantUpdates } from '@/utils/messageCenterOperations';
import { TenantUpdate } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export const useUpdates = (tenantId: string | null, autoFetch: boolean = true) => {
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  // Use React Query for better data fetching and caching
  const {
    data: updates = [],
    isLoading,
    refetch: refreshData,
    error
  } = useQuery<TenantUpdate[]>({
    queryKey: ['updates', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      console.log(`Fetching updates for tenant: ${tenantId}`);
      // Remove limit to get all updates
      return await getTenantUpdates(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: autoFetch, // Only auto-fetch when enabled
    retry: 2
  });

  // Debugging log
  useEffect(() => {
    console.log("useUpdates hook - received updates:", updates.length);
    if (error) {
      console.error("Error fetching updates:", error);
    }
  }, [updates, error]);

  const fetchUpdateData = async () => {
    if (!tenantId) return;
    
    setIsFetching(true);
    try {
      toast({
        title: "Fetching updates...",
        description: "Requesting update data from Microsoft Graph API",
        variant: "default",
      });
      
      const success = await fetchTenantUpdates(tenantId);
      
      if (success) {
        toast({
          title: "Fetching updates succeeded",
          description: "Update data is being retrieved from Microsoft Graph API",
          variant: "default",
        });
        
        // Wait a moment to allow the backend to process the data
        setTimeout(() => {
          refreshData();
          setIsFetching(false);
        }, 2000);
      } else {
        toast({
          title: "Fetching updates failed",
          description: "Could not fetch update data from Microsoft Graph API",
          variant: "destructive",
        });
        setIsFetching(false);
      }
    } catch (error) {
      console.error("Error triggering update fetch:", error);
      toast({
        title: "Error",
        description: "Failed to trigger update data fetch",
        variant: "destructive",
      });
      setIsFetching(false);
    }
  };

  // Filter updates to separate system messages and regular updates
  const hasSystemMessage = updates.some(u => 
    u.id === 'db-init' || 
    u.id === 'msal-error' || 
    u.tenantName === 'System Message'
  );

  const regularUpdates = updates.filter(u => 
    u.id !== 'db-init' && 
    u.id !== 'msal-error' && 
    u.tenantName !== 'System Message'
  );

  const systemMessages = updates.filter(u => 
    u.id === 'db-init' || 
    u.id === 'msal-error' || 
    u.tenantName === 'System Message'
  );

  return {
    updates,
    regularUpdates,
    systemMessages,
    hasSystemMessage,
    isLoading,
    isFetching,
    refreshData,
    fetchUpdateData
  };
};
