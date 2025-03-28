
import { useState, useEffect } from 'react';
import { getTenantUpdates, fetchTenantUpdates } from '@/utils/database';
import { TenantUpdate } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

export const useUpdates = (tenantId: string | null) => {
  const [updates, setUpdates] = useState<TenantUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tenantId) {
      fetchUpdates(tenantId);
    }
  }, [tenantId]);

  const fetchUpdates = async (tenantId: string) => {
    setIsLoading(true);
    
    try {
      const updateData = await getTenantUpdates(tenantId);
      setUpdates(updateData);
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast({
        title: "Error loading updates",
        description: "Could not load update information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    if (tenantId) {
      fetchUpdates(tenantId);
    }
  };

  const fetchUpdateData = async () => {
    if (!tenantId) return;
    
    setIsFetching(true);
    try {
      const success = await fetchTenantUpdates(tenantId);
      
      if (success) {
        toast({
          title: "Fetching updates succeeded",
          description: "Update data is being retrieved from Microsoft Graph API",
          variant: "default",
        });
        
        setTimeout(() => {
          refreshData();
        }, 2000);
      } else {
        toast({
          title: "Fetching updates failed",
          description: "Could not fetch update data from Microsoft Graph API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error triggering update fetch:", error);
      toast({
        title: "Error",
        description: "Failed to trigger update data fetch",
        variant: "destructive",
      });
    } finally {
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
