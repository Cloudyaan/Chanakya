
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import { getTenants } from '@/utils/database';
import { TenantConfig } from '@/utils/types';
import NotificationSettings from '@/components/Microsoft365/NotificationSettings';

const Notifications = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
        // Get the saved tenant ID from localStorage or use the first active tenant
        const savedTenant = localStorage.getItem('selectedTenant');
        if (savedTenant) {
          console.log('Using saved tenant from localStorage:', savedTenant);
          setSelectedTenant(savedTenant);
        } else {
          const activeTenant = loadedTenants.find(t => t.isActive);
          if (activeTenant) {
            console.log('Using first active tenant:', activeTenant.id);
            setSelectedTenant(activeTenant.id);
            localStorage.setItem('selectedTenant', activeTenant.id);
          }
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
      }
    }
    
    loadTenants();
    
    // Listen for tenant change events
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Tenant changed event:', customEvent.detail);
      setSelectedTenant(customEvent.detail.tenantId);
    };
    
    window.addEventListener('tenantChanged', handleTenantChange);
    
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, []);

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-m365-gray-500">Configure email notifications for Microsoft 365 updates</p>
        </motion.div>
        
        <NotificationSettings 
          tenants={tenants} 
          selectedTenant={selectedTenant} 
        />
      </main>
    </Microsoft365>
  );
};

export default Notifications;
