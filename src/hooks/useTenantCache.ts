
import { useState, useEffect, useRef } from 'react';
import { TenantConfig } from '@/utils/types';
import { getTenants } from '@/utils/database';

interface TenantCacheState {
  tenants: TenantConfig[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// Global cache to prevent multiple components from fetching simultaneously
let globalTenantCache: TenantCacheState = {
  tenants: [],
  isLoading: false,
  error: null,
  lastFetch: null
};

let activeRequest: Promise<TenantConfig[]> | null = null;
const subscribers = new Set<(cache: TenantCacheState) => void>();

const CACHE_DURATION = 30000; // 30 seconds cache

export const useTenantCache = (forceRefresh = false) => {
  const [cache, setCache] = useState<TenantCacheState>(globalTenantCache);
  const mountedRef = useRef(true);

  useEffect(() => {
    const updateCache = (newCache: TenantCacheState) => {
      if (mountedRef.current) {
        setCache(newCache);
      }
    };

    subscribers.add(updateCache);
    
    return () => {
      mountedRef.current = false;
      subscribers.delete(updateCache);
    };
  }, []);

  const notifySubscribers = (newCache: TenantCacheState) => {
    globalTenantCache = newCache;
    subscribers.forEach(callback => callback(newCache));
  };

  const fetchTenants = async (): Promise<TenantConfig[]> => {
    // Check if we have a valid cache and no force refresh
    const now = Date.now();
    if (!forceRefresh && 
        globalTenantCache.lastFetch && 
        now - globalTenantCache.lastFetch < CACHE_DURATION && 
        globalTenantCache.tenants.length > 0) {
      return globalTenantCache.tenants;
    }

    // If there's already an active request, wait for it
    if (activeRequest) {
      return activeRequest;
    }

    // Start loading state
    notifySubscribers({
      ...globalTenantCache,
      isLoading: true,
      error: null
    });

    try {
      activeRequest = getTenants();
      const tenants = await activeRequest;
      
      const newCache: TenantCacheState = {
        tenants,
        isLoading: false,
        error: null,
        lastFetch: Date.now()
      };

      notifySubscribers(newCache);
      return tenants;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tenants';
      console.error('Error fetching tenants:', error);
      
      notifySubscribers({
        ...globalTenantCache,
        isLoading: false,
        error: errorMessage
      });
      
      throw error;
    } finally {
      activeRequest = null;
    }
  };

  const refreshTenants = () => {
    return fetchTenants();
  };

  // Auto-fetch on mount if cache is empty or stale
  useEffect(() => {
    const now = Date.now();
    const isStale = !globalTenantCache.lastFetch || 
                   now - globalTenantCache.lastFetch > CACHE_DURATION;
    
    if ((globalTenantCache.tenants.length === 0 || isStale) && 
        !globalTenantCache.isLoading && 
        !activeRequest) {
      fetchTenants().catch(console.error);
    }
  }, []);

  return {
    tenants: cache.tenants,
    isLoading: cache.isLoading,
    error: cache.error,
    refreshTenants
  };
};

// Function to clear cache when tenants are modified
export const clearTenantCache = () => {
  globalTenantCache = {
    tenants: [],
    isLoading: false,
    error: null,
    lastFetch: null
  };
  subscribers.forEach(callback => callback(globalTenantCache));
};
