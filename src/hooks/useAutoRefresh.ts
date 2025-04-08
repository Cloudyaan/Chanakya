
import { useEffect, useRef, useState, useCallback } from 'react';

// Make the RefreshFunction type more flexible to accept different return types
type RefreshFunction = (...args: any[]) => any;

/**
 * Hook to automatically refresh data at specified intervals
 * @param refreshFunction The function to call for refreshing data
 * @param intervalMinutes The interval in minutes between refreshes
 * @param enabled Whether the auto-refresh is enabled
 * @param delay Optional delay in minutes before the first scheduled refresh
 * @param storageKey Optional key for localStorage to persist last refresh time
 * @returns Last refresh timestamp and a manual refresh function
 */
export const useAutoRefresh = (
  refreshFunction: RefreshFunction,
  intervalMinutes: number = 60,
  enabled: boolean = true,
  delay: number = 0,
  storageKey?: string
): [Date | null, () => Promise<void>] => {
  // Use ref to keep track of the interval ID
  const intervalRef = useRef<number | null>(null);
  const initialLoadRef = useRef<boolean>(true);
  
  // Track last refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(() => {
    // Initialize from localStorage if a storageKey is provided
    if (storageKey && typeof window !== 'undefined') {
      const storedTime = localStorage.getItem(storageKey);
      return storedTime ? new Date(storedTime) : null;
    }
    return null;
  });
  
  // Use ref to store the refresh function to avoid dependency issues
  const refreshFunctionRef = useRef<RefreshFunction>(refreshFunction);
  
  // Update the ref if the function changes
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction;
  }, [refreshFunction]);

  // Function to execute refresh and update timestamp
  const executeRefresh = useCallback(async () => {
    console.log('Executing refresh...');
    try {
      await refreshFunctionRef.current();
      const now = new Date();
      setLastRefreshTime(now);
      
      // Persist to localStorage if storageKey is provided
      if (storageKey && typeof window !== 'undefined') {
        console.log(`Storing last refresh time to localStorage key: ${storageKey}`);
        localStorage.setItem(storageKey, now.toISOString());
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    }
  }, [storageKey]);

  // Manual refresh function that users can call
  const manualRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    await executeRefresh();
  }, [executeRefresh]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only set up interval if enabled
    if (enabled) {
      console.log(`Setting up auto-refresh every ${intervalMinutes} minutes with ${delay} minutes initial delay`);
      
      // Determine if we need to run an initial refresh
      const shouldRunInitialRefresh = () => {
        // If we have a storage key, check when the last refresh was
        if (storageKey && lastRefreshTime) {
          const now = new Date();
          const lastRefresh = new Date(lastRefreshTime);
          const hoursSinceLastRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
          
          // If it's been more than intervalMinutes since last refresh, run it again
          return hoursSinceLastRefresh >= intervalMinutes / 60;
        }
        
        // If no last refresh or no storage key, run initial refresh if delay is 0
        return delay === 0 && !lastRefreshTime;
      };
      
      // Only run initial refresh if this is first load AND conditions are met
      if (initialLoadRef.current && shouldRunInitialRefresh()) {
        console.log('Running initial refresh based on conditions');
        setTimeout(() => executeRefresh(), 500); // Small delay to avoid immediate refresh
      }
      
      // Mark initial load as completed
      initialLoadRef.current = false;
      
      // Initial delay before first scheduled refresh
      if (delay > 0) {
        const initialDelayMs = delay * 60 * 1000;
        const initialTimeoutId = setTimeout(() => {
          console.log(`Executing first scheduled refresh after ${delay} minutes delay`);
          executeRefresh();
        }, initialDelayMs);
        
        // Clean up timeout if component unmounts during delay
        return () => clearTimeout(initialTimeoutId);
      }
      
      // Set up the interval
      const intervalMs = intervalMinutes * 60 * 1000;
      intervalRef.current = window.setInterval(() => {
        console.log(`Auto-refreshing data after ${intervalMinutes} minutes interval`);
        executeRefresh();
      }, intervalMs);
      
      // Clean up the interval on unmount
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [intervalMinutes, enabled, delay, executeRefresh, lastRefreshTime, storageKey]);

  return [lastRefreshTime, manualRefresh];
};
