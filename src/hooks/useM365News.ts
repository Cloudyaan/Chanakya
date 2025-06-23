
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { M365News } from '@/utils/types';
import { getM365News, fetchM365News } from '@/utils/m365NewsOperations';
import { useToast } from '@/hooks/use-toast';

export const useM365News = (tenantId: string | null) => {
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: newsItems = [],
    isLoading,
    refetch: refreshData,
    error
  } = useQuery<M365News[]>({
    queryKey: ['m365-news', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      console.log(`Fetching M365 news from database for tenant: ${tenantId}`);
      return await getM365News(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time for news
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1
  });

  // Debug logging
  useEffect(() => {
    console.log('useM365News hook - received news items:', newsItems.length);
    if (error) {
      console.error('Error fetching M365 news:', error);
    }
  }, [newsItems, error]);

  // Handle fetching news from external RSS feed
  const handleFetchM365News = async () => {
    if (!tenantId) {
      console.error('No tenant selected for M365 news fetch');
      toast({
        title: "Error",
        description: "No tenant selected. Please select a tenant first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetching(true);
    try {
      console.log(`Triggering M365 news fetch for tenant: ${tenantId}`);
      toast({
        title: "Fetching Microsoft 365 News...",
        description: "Getting latest news from Microsoft RSS feed",
        variant: "default",
      });
      
      const success = await fetchM365News(tenantId);
      
      if (success) {
        toast({
          title: "Fetching M365 news succeeded",
          description: "News data has been retrieved from Microsoft RSS feed",
          variant: "default",
        });
        
        // Invalidate queries and refresh data after fetch completes
        setTimeout(async () => {
          await queryClient.invalidateQueries({ queryKey: ['m365-news', tenantId] });
          await queryClient.invalidateQueries({ queryKey: ['refresh-times', tenantId] });
          await refreshData();
          setIsFetching(false);
        }, 3000); // Increased timeout for external RSS fetch
      } else {
        toast({
          title: "Fetching M365 news failed",
          description: "Could not fetch news data from Microsoft RSS feed",
          variant: "destructive",
        });
        setIsFetching(false);
      }
    } catch (error) {
      console.error('Error fetching M365 news:', error);
      toast({
        title: "Error",
        description: "Failed to trigger M365 news fetch",
        variant: "destructive",
      });
      setIsFetching(false);
    }
  };

  // Simple refresh function that only gets data from database
  const refreshFromDatabase = async () => {
    console.log("Refreshing M365 news from database only");
    await queryClient.invalidateQueries({ queryKey: ['m365-news', tenantId] });
    return refreshData();
  };

  return {
    newsItems,
    isLoading,
    isFetching,
    refreshData: refreshFromDatabase,
    handleFetchM365News
  };
};
