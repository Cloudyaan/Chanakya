
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import { getTenants, getTenantUpdates, fetchTenantUpdates } from '@/utils/database';
import { TenantConfig, TenantUpdate } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Updates = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [updates, setUpdates] = useState<TenantUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  // Load tenants on mount
  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
        // Select the first active tenant by default
        const activeTenant = loadedTenants.find(t => t.isActive);
        if (activeTenant) {
          setSelectedTenant(activeTenant.id);
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
        toast({
          title: "Error loading tenants",
          description: "Could not load tenant information",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }
    
    loadTenants();
  }, [toast]);

  // Fetch updates when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      fetchUpdates(selectedTenant);
    }
  }, [selectedTenant]);

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
    if (selectedTenant) {
      fetchUpdates(selectedTenant);
    }
  };

  const fetchUpdateData = async () => {
    if (!selectedTenant) return;
    
    setIsFetching(true);
    try {
      const success = await fetchTenantUpdates(selectedTenant);
      
      if (success) {
        toast({
          title: "Fetching updates succeeded",
          description: "Update data is being retrieved from Microsoft Graph API",
          variant: "default",
        });
        
        // Refresh the data after a short delay to allow the backend to process
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

  const activeTenants = tenants.filter(t => t.isActive);

  // Determine if there's a special system message
  const hasSystemMessage = updates.some(u => 
    u.id === 'db-init' || 
    u.id === 'msal-error' || 
    u.tenantName === 'System Message'
  );

  // Filter out regular updates (non-system messages)
  const regularUpdates = updates.filter(u => 
    u.id !== 'db-init' && 
    u.id !== 'msal-error' && 
    u.tenantName !== 'System Message'
  );

  // Get system messages
  const systemMessages = updates.filter(u => 
    u.id === 'db-init' || 
    u.id === 'msal-error' || 
    u.tenantName === 'System Message'
  );

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-wrap justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Message Center Updates</h1>
            <p className="text-m365-gray-500">View all service announcements from Microsoft</p>
          </div>
          
          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {activeTenants.length > 1 && (
              <Select 
                value={selectedTenant || ''} 
                onValueChange={setSelectedTenant}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
                  {activeTenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={fetchUpdateData}
              disabled={isLoading || isFetching || !selectedTenant}
              className="flex items-center gap-1"
            >
              <Download size={16} className={isFetching ? "animate-bounce" : ""} />
              Fetch Updates
            </Button>
          </div>
        </motion.div>
        
        {activeTenants.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <h2 className="text-xl text-gray-500 mb-2">No Active Tenants</h2>
            <p className="text-gray-400 mb-4">Please add and activate at least one Microsoft 365 tenant in Settings.</p>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <div className="flex flex-col items-center">
                  <RefreshCw size={40} className="animate-spin text-m365-600 mb-4" />
                  <p className="text-m365-gray-500">Loading updates...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {hasSystemMessage && (
                  <div className="mb-8">
                    {systemMessages.map((message) => (
                      <div key={message.id} className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded">
                        <div className="flex">
                          <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
                          <div>
                            <p className="font-semibold text-amber-700">{message.title}</p>
                            <p className="text-amber-600 mt-1">{message.description}</p>
                            <div className="mt-3 flex gap-2">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={fetchUpdateData}
                                disabled={isFetching}
                              >
                                {isFetching ? (
                                  <>
                                    <RefreshCw size={14} className="mr-2 animate-spin" />
                                    Fetching...
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} className="mr-2" />
                                    Fetch Updates Now
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {regularUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {regularUpdates.map((update) => (
                      <div key={update.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">
                              {update.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {update.category}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                update.severity === 'High' 
                                  ? 'bg-red-100 text-red-800' 
                                  : update.severity === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {update.severity}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                update.actionType === 'Action Required' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {update.actionType}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(update.publishedDate)}
                          </div>
                        </div>
                        <p className="mt-3 text-gray-600">
                          {update.description}
                        </p>
                        <div className="mt-2 text-xs text-gray-400">
                          ID: {update.messageId || update.id}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !hasSystemMessage && (
                  <div className="p-8 text-center border border-dashed rounded-lg">
                    <h2 className="text-xl text-gray-500 mb-2">No Updates Available</h2>
                    <p className="text-gray-400 mb-4">
                      Click the "Fetch Updates" button above to retrieve service announcements from Microsoft Graph API.
                    </p>
                    <Button variant="default" onClick={fetchUpdateData} disabled={isFetching}>
                      {isFetching ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Download size={16} className="mr-2" />
                          Fetch Updates
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </Microsoft365>
  );
};

export default Updates;
