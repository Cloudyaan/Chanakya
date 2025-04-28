
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { M365News } from '@/utils/types';
import { getM365News, fetchM365News } from '@/utils/m365NewsOperations';
import { parseISO, differenceInDays, parse, isValid } from 'date-fns';

export const useM365News = (tenantId: string | null) => {
  const [isFetching, setIsFetching] = useState(false);

  // React Query for M365 news with retry and stale time config
  // Disabled refetchOnMount to prevent auto-fetch on page load
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
    refetchOnMount: false, // Prevent auto-fetch when component mounts
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Console log for debugging
  useEffect(() => {
    console.log("useM365News hook - received news items:", newsItems.length);
    if (error) {
      console.error("Error fetching M365 news:", error);
    }
  }, [newsItems, error]);

  // Filter to get only items from the last 10 days with robust date parsing
  const recentNewsItems = newsItems.filter(item => {
    if (!item.published_date) return false;
    
    try {
      let publishedDate: Date | null = null;
      const dateStr = item.published_date;
      
      // Try parsing as ISO format first
      publishedDate = parseISO(dateStr);
      
      // If not valid ISO format, try other common formats
      if (!isValid(publishedDate)) {
        // Format like "Mon, 10 Mar 2025 23:30:35 Z"
        publishedDate = parse(dateStr, 'EEE, dd MMM yyyy HH:mm:ss X', new Date());
      }
      
      // If still not valid, try to use Date constructor as fallback
      if (!isValid(publishedDate)) {
        publishedDate = new Date(dateStr);
      }
      
      // If we have a valid date now
      if (isValid(publishedDate)) {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        return publishedDate >= tenDaysAgo;
      }
      
      console.error(`Could not parse date: ${dateStr}`);
      return false;
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

  // We'll no longer automatically refresh data when tenantId changes
  // to prevent unexpected auto-fetches

  return {
    newsItems: recentNewsItems,
    isLoading,
    isFetching,
    handleFetchM365News,
    refreshData,
    error
  };
};
