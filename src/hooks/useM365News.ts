
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { M365News } from '@/utils/types';
import { getM365News, fetchM365News } from '@/utils/m365NewsOperations';

export const useM365News = (tenantId: string | null) => {
  const [isFetching, setIsFetching] = useState(false);

  // React Query for M365 news with retry and stale time config
  const {
    data: newsItems = [],
    isLoading,
    refetch: refreshData,
    error
  } = useQuery<M365News[]>({
    queryKey: ['m365-news', tenantId],
    queryFn: () => (tenantId ? getM365News(tenantId) : Promise.resolve([])),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Console log for debugging
  useEffect(() => {
    console.log("useM365News hook - received news items:", newsItems);
    if (error) {
      console.error("Error fetching M365 news:", error);
    }
  }, [newsItems, error]);

  // Filter to get only items from the last 10 days
  const recentNewsItems = newsItems.filter(item => {
    if (!item.published_date) return false;
    
    try {
      const publishedDate = new Date(item.published_date);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      return publishedDate >= tenDaysAgo;
    } catch (e) {
      console.error("Error parsing date:", e, item);
      return false;
    }
  });

  // Fetch M365 news from the backend
  const handleFetchM365News = async () => {
    if (!tenantId) {
      toast.error('No tenant selected');
      return;
    }

    setIsFetching(true);
    try {
      toast.info('Fetching Microsoft 365 news updates...');
      const success = await fetchM365News(tenantId);
      
      if (success) {
        toast.success('Microsoft 365 news updates fetched successfully');
        // Wait a moment before refreshing to allow backend processing
        setTimeout(async () => {
          await refreshData();
          setIsFetching(false);
        }, 1000);
      } else {
        toast.error('Failed to fetch Microsoft 365 news updates');
        setIsFetching(false);
      }
    } catch (error) {
      console.error('Error fetching M365 news:', error);
      toast.error('An error occurred while fetching news updates');
      setIsFetching(false);
    }
  };

  // Refresh data when tenantId changes
  useEffect(() => {
    if (tenantId) {
      console.log("Tenant ID changed, refreshing M365 news data");
      refreshData();
    }
  }, [tenantId, refreshData]);

  return {
    newsItems: recentNewsItems,
    isLoading,
    isFetching,
    handleFetchM365News,
    refreshData,
    error
  };
};
