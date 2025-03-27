
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NavBar from '@/components/NavBar';
import TenantForm from '@/components/Settings/TenantForm';
import TenantsList from '@/components/Settings/TenantsList';
import { Button } from '@/components/ui/button';
import { TenantConfig } from '@/utils/types';

const Settings = () => {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantConfig | null>(null);

  const handleAddTenant = (tenant: Omit<TenantConfig, 'id' | 'dateAdded'>) => {
    const newTenant: TenantConfig = {
      ...tenant,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    
    setTenants([...tenants, newTenant]);
    setIsAddingTenant(false);
    
    toast({
      title: "Tenant added",
      description: `${tenant.name} has been successfully added.`,
    });
  };

  const handleEditTenant = (updatedTenant: TenantConfig) => {
    setTenants(tenants.map(tenant => 
      tenant.id === updatedTenant.id ? updatedTenant : tenant
    ));
    setEditingTenant(null);
    
    toast({
      title: "Tenant updated",
      description: `${updatedTenant.name} has been successfully updated.`,
    });
  };

  const handleDeleteTenant = (id: string) => {
    const tenantToDelete = tenants.find(tenant => tenant.id === id);
    setTenants(tenants.filter(tenant => tenant.id !== id));
    
    toast({
      title: "Tenant removed",
      description: `${tenantToDelete?.name} has been successfully removed.`,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-m365-gray-500">Configure your M365 License Keeper instance</p>
        </motion.div>
        
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-border shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium">M365 Tenants</h2>
                <p className="text-m365-gray-500 text-sm">Manage your Microsoft 365 tenant connections</p>
              </div>
              
              <Button onClick={() => setIsAddingTenant(true)} className="gap-2">
                <Plus size={16} />
                <span>Add Tenant</span>
              </Button>
            </div>
            
            {isAddingTenant ? (
              <TenantForm 
                onSubmit={handleAddTenant} 
                onCancel={() => setIsAddingTenant(false)}
              />
            ) : editingTenant ? (
              <TenantForm 
                initialData={editingTenant}
                onSubmit={handleEditTenant} 
                onCancel={() => setEditingTenant(null)}
              />
            ) : (
              <TenantsList 
                tenants={tenants} 
                onEdit={setEditingTenant} 
                onDelete={handleDeleteTenant}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
