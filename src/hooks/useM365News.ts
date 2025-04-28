
import { useState, useEffect } from 'react';
import { M365News } from '@/utils/types';
import { getM365News, fetchM365News } from '@/utils/m365NewsOperations';
import { useToast } from '@/hooks/use-toast';

export const useM365News = (tenantId: string | null, autoFetch: boolean = true) => {
  const [newsItems, setNewsItems] = useState<M365News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tenantId && autoFetch) {
      loadM365News(tenantId);
    } else if (tenantId) {
      // Just set loading to false if we're not auto-fetching
      setIsLoading(false);
    }
  }, [tenantId, autoFetch]);

  const loadM365News = async (tenantId: string) => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      console.log('Loading M365 news for tenant ID:', tenantId);
      const data = await getM365News(tenantId);
      console.log('M365 news loaded:', data);
      setNewsItems(data);
    } catch (error) {
      console.error('Error loading M365 news:', error);
      toast({
        title: "Error loading M365 news",
        description: "Could not load news and announcements",
        variant: "destructive",
      });
      setNewsItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchM365News = async () => {
    if (!tenantId) {
      console.error('No tenant selected');
      toast({
        title: "Error",
        description: "No tenant selected. Please select a tenant first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetching(true);
    try {
      console.log(`Triggering fetch M365 news for tenant: ${tenantId}`);
      const success = await fetchM365News(tenantId);
      
      if (success) {
        toast({
          title: "Fetching M365 news succeeded",
          description: "News data is being retrieved",
          variant: "default",
        });
        // Reload the data after fetching with a small delay
        setTimeout(() => loadM365News(tenantId), 2000);
      } else {
        toast({
          title: "Fetching M365 news failed",
          description: "Could not fetch news data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching M365 news:', error);
      toast({
        title: "Error",
        description: "Failed to trigger news data fetch",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const refreshData = async () => {
    if (tenantId) {
      return loadM365News(tenantId);
    }
    return Promise.resolve();
  };

  return {
    newsItems,
    isLoading,
    isFetching,
    refreshData,
    loadM365News,
    handleFetchM365News
  };
};
