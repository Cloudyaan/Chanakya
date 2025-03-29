import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import { getTenants } from '@/utils/database';
import { TenantConfig, TenantUpdate } from '@/utils/types';
import UpdateDetailsDialog from '@/components/Microsoft365/UpdateDetailsDialog';
import UpdatesHeader from '@/components/Microsoft365/UpdatesHeader';
import NoTenantsMessage from '@/components/Microsoft365/NoTenantsMessage';
import UpdatesContent from '@/components/Microsoft365/UpdatesContent';
import { useUpdates } from '@/hooks/useUpdates';
const Updates = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<TenantUpdate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Use our custom hook for updates functionality
  const {
    regularUpdates,
    systemMessages,
    hasSystemMessage,
    isLoading,
    isFetching,
    refreshData,
    fetchUpdateData
  } = useUpdates(selectedTenant);
  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        const savedTenant = localStorage.getItem('selectedTenant');
        if (savedTenant) {
          setSelectedTenant(savedTenant);
        } else {
          const activeTenant = loadedTenants.find(t => t.isActive);
          if (activeTenant) {
            setSelectedTenant(activeTenant.id);
          }
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
      }
    }
    loadTenants();
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSelectedTenant(customEvent.detail.tenantId);
    };
    window.addEventListener('tenantChanged', handleTenantChange);
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, []);
  const handleUpdateClick = (update: TenantUpdate) => {
    setSelectedUpdate(update);
    setIsDialogOpen(true);
  };
  const activeTenants = tenants.filter(t => t.isActive);
  return <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.4
      }} className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
            <p className="text-m365-gray-500">View all updates from Microsoft 365 and Windows</p>
          </div>
          
          <UpdatesHeader onRefresh={refreshData} onFetch={fetchUpdateData} isLoading={isLoading} isFetching={isFetching} selectedTenant={selectedTenant} />
        </motion.div>
        
        {activeTenants.length === 0 ? <NoTenantsMessage /> : <div className="space-y-6">
            <UpdatesContent isLoading={isLoading} hasSystemMessage={hasSystemMessage} systemMessages={systemMessages} regularUpdates={regularUpdates} isFetching={isFetching} onFetchUpdates={fetchUpdateData} onUpdateClick={handleUpdateClick} />

            <UpdateDetailsDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} update={selectedUpdate} />
          </div>}
      </main>
    </Microsoft365>;
};
export default Updates;