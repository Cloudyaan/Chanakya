
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
        const response = await fetch(`${API_URL}/refresh-times?tenantId=${tenantId}`);
        if (!response.ok) {
          console.error('Failed to fetch refresh times:', response.status);
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching refresh times:', error);
        return [];
      }
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes to catch auto-updates
  });

  // Helper function to get last refresh time for a specific data type
  const getLastRefreshTime = (dataType: string): Date | null => {
    const refreshData = refreshTimes.find(rt => rt.data_type === dataType);
    if (!refreshData?.last_refresh_time) return null;
    
    try {
      return new Date(refreshData.last_refresh_time);
    } catch (e) {
      console.error('Error parsing refresh time:', e);
      return null;
    }
  };

  return {
    messageCenterLastRefresh: getLastRefreshTime('message_center'),
    windowsLastRefresh: getLastRefreshTime('windows_updates'),
    newsLastRefresh: getLastRefreshTime('news'),
    refreshTimes
  };
};
