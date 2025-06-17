
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { M365News } from '@/utils/types';
import { getM365News, fetchM365News } from '@/utils/m365NewsOperations';
import { parseISO, differenceInDays, parse, isValid } from 'date-fns';

export const useM365News = (tenantId: string | null) => {
  const [isFetching, setIsFetching] = useState(false);

  // Enhanced logging for debugging
  useEffect(() => {
    console.log("useM365News hook - tenantId changed:", tenantId);
  }, [tenantId]);

  // React Query for M365 news with enhanced configuration
  const {
    data: rawNewsItems = [],
    isLoading,
    refetch: refreshData,
    error,
    isSuccess,
    isError
  } = useQuery<M365News[]>({
    queryKey: ['m365-news', tenantId],
    queryFn: async () => {
      console.log("useM365News queryFn - executing for tenantId:", tenantId);
      if (!tenantId) {
        console.log("useM365News queryFn - no tenantId, returning empty array");
        return [];
      }
      
      try {
        const result = await getM365News(tenantId);
        console.log("useM365News queryFn - raw result:", result);
        console.log("useM365News queryFn - result type:", typeof result, Array.isArray(result));
        console.log("useM365News queryFn - result length:", result?.length || 0);
        
        // Ensure we return an array
        if (!Array.isArray(result)) {
          console.error("useM365News queryFn - result is not an array:", result);
          return [];
        }
        
        return result;
      } catch (error) {
        console.error("useM365News queryFn - error fetching news:", error);
        throw error; // Let React Query handle the error
      }
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true, // Changed to true to ensure fresh data
    refetchOnWindowFocus: false, // Disable window focus refetch
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Enhanced debugging for query states
  useEffect(() => {
    console.log("useM365News hook - query states:", {
      isLoading,
      isSuccess,
      isError,
      error,
      tenantId,
      rawNewsItemsCount: rawNewsItems?.length || 0,
      rawNewsItemsType: typeof rawNewsItems,
      isArray: Array.isArray(rawNewsItems)
    });
    
    if (isError) {
      console.error("useM365News hook - query error:", error);
    }
    
    if (isSuccess && rawNewsItems) {
      console.log("useM365News hook - query success, raw data sample:", 
        rawNewsItems.slice(0, 2).map(item => ({
          id: item?.id,
          title: item?.title,
          published_date: item?.published_date,
          tenantId: item?.tenantId
        }))
      );
    }
  }, [isLoading, isSuccess, isError, error, tenantId, rawNewsItems]);

  // Parse date with multiple fallback methods
  const parsePublishedDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      // Try parsing as ISO format first
      let publishedDate = parseISO(dateStr);
      if (isValid(publishedDate)) {
        return publishedDate;
      }
      
      // Try parsing RFC 2822 format: "Wed, 28 May 2025 23:00:19 Z"
      publishedDate = parse(dateStr, 'EEE, dd MMM yyyy HH:mm:ss X', new Date());
      if (isValid(publishedDate)) {
        return publishedDate;
      }
      
      // Try parsing without timezone: "Wed, 28 May 2025 23:00:19"
      publishedDate = parse(dateStr, 'EEE, dd MMM yyyy HH:mm:ss', new Date());
      if (isValid(publishedDate)) {
        return publishedDate;
      }
      
      // Try with different timezone format: "Wed, 28 May 2025 23:00:19 GMT"
      publishedDate = parse(dateStr, 'EEE, dd MMM yyyy HH:mm:ss z', new Date());
      if (isValid(publishedDate)) {
        return publishedDate;
      }
      
      // As a last resort, try the Date constructor
      publishedDate = new Date(dateStr);
      if (isValid(publishedDate)) {
        return publishedDate;
      }
      
      console.warn(`Could not parse date: ${dateStr}`);
      return null;
    } catch (e) {
      console.error("Error parsing date:", e, dateStr);
      return null;
    }
  };

  // Process and filter news items
  const newsItems = (() => {
    console.log("useM365News - processing news items, rawNewsItems:", rawNewsItems);
    
    if (!Array.isArray(rawNewsItems)) {
      console.error("useM365News - rawNewsItems is not an array:", typeof rawNewsItems, rawNewsItems);
      return [];
    }
    
    if (rawNewsItems.length === 0) {
      console.log("useM365News - rawNewsItems is empty array");
      return [];
    }
    
    // Filter to get only items from the last 30 days
    const recentNewsItems = rawNewsItems.filter(item => {
      if (!item || !item.published_date) {
        console.warn('News item without published_date:', item?.title || 'unknown');
        return false;
      }
      
      const publishedDate = parsePublishedDate(item.published_date);
      
      if (!publishedDate) {
        console.warn(`Failed to parse date for item: ${item.title}, date: ${item.published_date}`);
        return false;
      }
      
      // Check if the date is within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const isRecent = publishedDate >= thirtyDaysAgo;
      if (!isRecent) {
        console.log(`Filtering out old item: ${item.title}, published: ${publishedDate.toISOString()}`);
      }
      
      return isRecent;
    });
    
    console.log(`useM365News - filtered ${rawNewsItems.length} total items to ${recentNewsItems.length} recent items`);
    return recentNewsItems;
  })();

  // Debug the final result
  useEffect(() => {
    console.log('useM365News - final newsItems:', {
      count: newsItems.length,
      isArray: Array.isArray(newsItems),
      sample: newsItems.slice(0, 3).map(item => ({
        title: item?.title,
        published_date: item?.published_date,
        parsed_date: parsePublishedDate(item?.published_date || '')?.toISOString(),
        tenantId: item?.tenantId
      }))
    });
  }, [newsItems]);

  // Fetch M365 news from the backend
  const handleFetchM365News = async () => {
    if (!tenantId) {
      toast.error('No tenant selected');
      console.error('handleFetchM365News - no tenantId provided');
      return;
    }

    console.log('handleFetchM365News - starting fetch for tenantId:', tenantId);
    setIsFetching(true);
    try {
      toast.info('Fetching Microsoft 365 news updates...');
      const success = await fetchM365News(tenantId);
      
      if (success) {
        toast.success('Microsoft 365 news updates fetched successfully');
        console.log('handleFetchM365News - fetch successful, refreshing data');
        // Wait a moment before refreshing to allow backend processing
        setTimeout(async () => {
          await refreshData();
          setIsFetching(false);
        }, 1000);
      } else {
        toast.error('Failed to fetch Microsoft 365 news updates');
        console.error('handleFetchM365News - fetch failed');
        setIsFetching(false);
      }
    } catch (error) {
      console.error('Error fetching M365 news:', error);
      toast.error('An error occurred while fetching news updates');
      setIsFetching(false);
    }
  };

  return {
    newsItems,
    isLoading,
    isFetching,
    handleFetchM365News,
    refreshData,
    error
  };
};
