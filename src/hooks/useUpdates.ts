
import { useState, useEffect } from 'react';
import { getTenantUpdates, fetchTenantUpdates } from '@/utils/messageCenterOperations';
import { TenantUpdate } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useUpdates = (tenantId: string | null) => {
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query only for data retrieval from database, disable all automatic fetching
  const {
    data: updates = [],
    isLoading,
    refetch: refreshData,
    error
  } = useQuery<TenantUpdate[]>({
    queryKey: ['updates', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      console.log(`Fetching updates from database for tenant: ${tenantId}`);
      return await getTenantUpdates(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30, // 30 seconds - allow some staleness but not too much
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't fetch when window gains focus
    refetchOnReconnect: false, // Don't fetch when network reconnects
    refetchInterval: false, // Disable automatic refetching
    retry: 1 // Reduce retry attempts
  });

  // Debugging log
  useEffect(() => {
    console.log("useUpdates hook - received updates:", updates.length);
    if (error) {
      console.error("Error fetching updates:", error);
    }
  }, [updates, error]);

  // Manual fetch function for when user explicitly wants to fetch new data from Microsoft Graph
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
        
        // Wait a moment to allow the backend to process the data, then invalidate and refetch
        setTimeout(async () => {
          // Invalidate all related queries to ensure fresh data
          await queryClient.invalidateQueries({ queryKey: ['updates', tenantId] });
          await queryClient.invalidateQueries({ queryKey: ['refresh-times', tenantId] });
          
          // Force refetch to get the latest data
          await refreshData();
          setIsFetching(false);
        }, 3000); // Increased timeout to ensure backend processing completes
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

  // Simple refresh function that only gets data from database
  const refreshFromDatabase = async () => {
    console.log("Refreshing data from database only");
    // Invalidate cache first to ensure fresh data
    await queryClient.invalidateQueries({ queryKey: ['updates', tenantId] });
    return refreshData();
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
    refreshData: refreshFromDatabase, // Only refresh from database
    fetchUpdateData // Explicit function to fetch from Microsoft Graph
  };
};
