
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

  // React Query for M365 news with NO automatic fetching
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
        // Don't throw error, return empty array to prevent UI from breaking
        return [];
      }
    },
    enabled: false, // Disable automatic fetching
    staleTime: Infinity, // Never consider data stale
    refetchOnMount: false, // Don't fetch when component mounts
    refetchOnWindowFocus: false, // Don't fetch when window gains focus
    refetchOnReconnect: false, // Don't fetch when network reconnects
    refetchInterval: false, // Disable automatic refetching
    retry: 1,
    retryDelay: 2000,
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

  // Process and filter news items - show recent items (last 90 days)
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
    
    console.log("useM365News - processing", rawNewsItems.length, "news items");
    
    // Process all items first to see what we're working with
    const processedItems = rawNewsItems.map(item => {
      const publishedDate = parsePublishedDate(item.published_date || '');
      const daysSincePublished = publishedDate ? differenceInDays(new Date(), publishedDate) : null;
      
      return {
        ...item,
        parsedDate: publishedDate,
        daysAgo: daysSincePublished
      };
    });
    
    // Filter to last 90 days to be more permissive
    const recentNewsItems = processedItems.filter(item => {
      if (!item.parsedDate) {
        console.log('Including news item without valid date:', item.title);
        return true; // Include items without valid dates
      }
      
      // Check if the date is within the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const isRecent = item.parsedDate >= ninetyDaysAgo;
      if (!isRecent) {
        console.log(`Filtering out old item: ${item.title}, published: ${item.parsedDate.toISOString()}, days ago: ${item.daysAgo}`);
      }
      
      return isRecent;
    });
    
    console.log(`useM365News - filtered ${rawNewsItems.length} total items to ${recentNewsItems.length} recent items (90-day filter)`);
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

  // Manual refresh function - only refreshes data from database
  const handleRefreshData = async () => {
    if (!tenantId) {
      console.log('handleRefreshData - no tenantId provided');
      return;
    }

    console.log('handleRefreshData - refreshing data for tenantId:', tenantId);
    await refreshData();
  };

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
    refreshData: handleRefreshData,
    error
  };
};
