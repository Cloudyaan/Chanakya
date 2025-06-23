
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/utils/api';

interface RefreshTime {
  tenant_id: string;
  data_type: string;
  last_refresh_time: string;
  status: string;
}

export const useRefreshTimes = (tenantId: string | null) => {
  const { data: refreshTimes = [] } = useQuery<RefreshTime[]>({
    queryKey: ['refresh-times', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      try {
        console.log(`Fetching refresh times for tenant: ${tenantId}`);
        const response = await fetch(`${API_URL}/refresh-times?tenantId=${tenantId}`);
        if (!response.ok) {
          console.error('Failed to fetch refresh times:', response.status);
          return [];
        }
        const data = await response.json();
        console.log('Refresh times received:', data);
        return data;
      } catch (error) {
        console.error('Error fetching refresh times:', error);
        return [];
      }
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30, // 30 seconds stale time for more frequent updates
    refetchInterval: 1000 * 60, // Refetch every minute to catch auto-updates quickly
  });

  // Helper function to get last refresh time for a specific data type
  const getLastRefreshTime = (dataType: string): Date | null => {
    const refreshData = refreshTimes.find(rt => rt.data_type === dataType);
    console.log(`Getting refresh time for ${dataType}:`, refreshData);
    
    if (!refreshData?.last_refresh_time) {
      console.log(`No refresh time found for ${dataType}`);
      return null;
    }
    
    try {
      const date = new Date(refreshData.last_refresh_time);
      console.log(`Parsed refresh time for ${dataType}:`, date);
      return date;
    } catch (e) {
      console.error('Error parsing refresh time:', e);
      return null;
    }
  };

  // Log refresh times for debugging
  useEffect(() => {
    if (refreshTimes.length > 0) {
      console.log('Current refresh times:', refreshTimes);
      console.log('Message center refresh:', getLastRefreshTime('message_center'));
      console.log('Windows updates refresh:', getLastRefreshTime('windows_updates'));
      console.log('News refresh:', getLastRefreshTime('news'));
    }
  }, [refreshTimes]);

  return {
    messageCenterLastRefresh: getLastRefreshTime('message_center'),
    windowsLastRefresh: getLastRefreshTime('windows_updates'),
    newsLastRefresh: getLastRefreshTime('news'),
    refreshTimes
  };
};
