import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NavBar from '@/components/NavBar';
import TenantForm from '@/components/Settings/TenantForm';
import TenantsList from '@/components/Settings/TenantsList';
import AzureForm from '@/components/Settings/AzureForm';
import AzureList from '@/components/Settings/AzureList';
import IdentityProviderForm from '@/components/Settings/IdentityProviderForm';
import IdentityProviderList from '@/components/Settings/IdentityProviderList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantConfig, AzureConfig, IdentityProviderConfig } from '@/utils/types';
import { 
  initDatabases, 
  getTenants, 
  addTenant, 
  updateTenant, 
  deleteTenant,
  getAzureAccounts,
  addAzureAccount,
  updateAzureAccount,
  deleteAzureAccount
} from '@/utils/database';
import {
  getIdentityProviders,
  addIdentityProvider,
  updateIdentityProvider,
  deleteIdentityProvider
} from '@/utils/identityOperations';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

const Settings = () => {
  const { toast } = useToast();
  
  // M365 tenant state
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Azure account state
  const [azureAccounts, setAzureAccounts] = useState<AzureConfig[]>([]);
  const [isAddingAzure, setIsAddingAzure] = useState(false);
  const [editingAzure, setEditingAzure] = useState<AzureConfig | null>(null);

  // Identity provider state
  const [identityProviders, setIdentityProviders] = useState<IdentityProviderConfig[]>([]);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<IdentityProviderConfig | null>(null);

  // Initialize database and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        await initDatabases();
        loadTenants();
        loadAzureAccounts();
        loadIdentityProviders();
      } catch (error) {
        console.error("Error initializing data:", error);
        toast({
          title: "Database Error",
          description: "There was an error connecting to the database",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadTenants = async () => {
    const loadedTenants = await getTenants();
    setTenants(loadedTenants);
  };

  const loadAzureAccounts = async () => {
    const loadedAccounts = await getAzureAccounts();
    setAzureAccounts(loadedAccounts);
  };

  const loadIdentityProviders = async () => {
    const loadedProviders = await getIdentityProviders();
    setIdentityProviders(loadedProviders);
  };

  // M365 Tenant handlers
  const handleAddTenant = async (tenant: Omit<TenantConfig, 'id' | 'dateAdded'>) => {
    const newTenant: TenantConfig = {
      ...tenant,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    
    const success = await addTenant(newTenant);
    
    if (success) {
      await loadTenants();
      setIsAddingTenant(false);
      
      toast({
        title: "Tenant added",
        description: `${tenant.name} has been successfully added.`,
      });
    } else {
      toast({
        title: "Error adding tenant",
        description: "There was an error saving the tenant information",
        variant: "destructive",
      });
    }
  };

  const handleEditTenant = async (updatedTenant: TenantConfig) => {
    console.log("Updating tenant with complete data:", updatedTenant);
    
    if (!updatedTenant.id) {
      console.error("Error: Missing tenant ID when updating tenant");
      toast({
        title: "Error updating tenant",
        description: "Unable to update tenant: Missing tenant ID",
        variant: "destructive",
      });
      return;
    }
    
    const success = await updateTenant(updatedTenant);
    
    if (success) {
      await loadTenants();
      setEditingTenant(null);
      
      toast({
        title: "Tenant updated",
        description: `${updatedTenant.name} has been successfully updated.`,
      });
    } else {
      toast({
        title: "Error updating tenant",
        description: "There was an error updating the tenant information",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTenant = async (id: string) => {
    const tenantToDelete = tenants.find(tenant => tenant.id === id);
    const success = await deleteTenant(id);
    
    if (success) {
      await loadTenants();
      
      toast({
        title: "Tenant removed",
        description: `${tenantToDelete?.name} has been successfully removed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error removing tenant",
        description: "There was an error removing the tenant",
        variant: "destructive",
      });
    }
  };

  // Azure account handlers
  const handleAddAzure = async (azure: Omit<AzureConfig, 'id' | 'dateAdded'>) => {
    const newAzure: AzureConfig = {
      ...azure,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    
    const success = await addAzureAccount(newAzure);
    
    if (success) {
      await loadAzureAccounts();
      setIsAddingAzure(false);
      
      toast({
        title: "Azure account added",
        description: `${azure.name} has been successfully added.`,
      });
    } else {
      toast({
        title: "Error adding Azure account",
        description: "There was an error saving the Azure account information",
        variant: "destructive",
      });
    }
  };

  const handleEditAzure = async (updatedAzure: AzureConfig) => {
    const success = await updateAzureAccount(updatedAzure);
    
    if (success) {
      await loadAzureAccounts();
      setEditingAzure(null);
      
      toast({
        title: "Azure account updated",
        description: `${updatedAzure.name} has been successfully updated.`,
      });
    } else {
      toast({
        title: "Error updating Azure account",
        description: "There was an error updating the Azure account information",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAzure = async (id: string) => {
    const azureToDelete = azureAccounts.find(azure => azure.id === id);
    const success = await deleteAzureAccount(id);
    
    if (success) {
      await loadAzureAccounts();
      
      toast({
        title: "Azure account removed",
        description: `${azureToDelete?.name} has been successfully removed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error removing Azure account",
        description: "There was an error removing the Azure account",
        variant: "destructive",
      });
    }
  };

  // Identity provider handlers
  const handleAddProvider = async (provider: Omit<IdentityProviderConfig, 'id' | 'dateAdded'>) => {
    const success = await addIdentityProvider(provider);
    
    if (success) {
      await loadIdentityProviders();
      setIsAddingProvider(false);
      
      toast({
        title: "Identity provider added",
        description: `${provider.name} has been successfully added.`,
      });
    } else {
      toast({
        title: "Error adding identity provider",
        description: "There was an error saving the identity provider information",
        variant: "destructive",
      });
    }
  };

  const handleEditProvider = async (updatedProvider: IdentityProviderConfig) => {
    const success = await updateIdentityProvider(updatedProvider);
    
    if (success) {
      await loadIdentityProviders();
      setEditingProvider(null);
      
      toast({
        title: "Identity provider updated",
        description: `${updatedProvider.name} has been successfully updated.`,
      });
    } else {
      toast({
        title: "Error updating identity provider",
        description: "There was an error updating the identity provider information",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProvider = async (id: string) => {
    const providerToDelete = identityProviders.find(provider => provider.id === id);
    const success = await deleteIdentityProvider(id);
    
    if (success) {
      await loadIdentityProviders();
      
      toast({
        title: "Identity provider removed",
        description: `${providerToDelete?.name} has been successfully removed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error removing identity provider",
        description: "There was an error removing the identity provider",
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedRoute>
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
            <p className="text-m365-gray-500">Configure your Chanakya instance</p>
          </motion.div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p>Loading settings...</p>
            </div>
          ) : (
            <div className="mb-8">
              <Tabs defaultValue="m365" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="m365">Microsoft 365 Tenants</TabsTrigger>
                  <TabsTrigger value="azure">Azure Accounts</TabsTrigger>
                  <TabsTrigger value="identity">Identity Providers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="m365">
                  <div className="bg-white rounded-lg border border-border shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-medium">Microsoft 365 Tenants</h2>
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
                        existingTenants={tenants}
                      />
                    ) : editingTenant ? (
                      <TenantForm 
                        initialData={editingTenant}
                        onSubmit={handleEditTenant} 
                        onCancel={() => setEditingTenant(null)}
                        existingTenants={tenants}
                      />
                    ) : (
                      <TenantsList 
                        tenants={tenants} 
                        onEdit={setEditingTenant} 
                        onDelete={handleDeleteTenant}
                      />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="azure">
                  <div className="bg-white rounded-lg border border-border shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-medium">Azure Accounts</h2>
                        <p className="text-m365-gray-500 text-sm">Manage your Azure account connections</p>
                      </div>
                      
                      <Button onClick={() => setIsAddingAzure(true)} className="gap-2">
                        <Plus size={16} />
                        <span>Add Azure Account</span>
                      </Button>
                    </div>
                    
                    {isAddingAzure ? (
                      <AzureForm 
                        onSubmit={handleAddAzure} 
                        onCancel={() => setIsAddingAzure(false)}
                      />
                    ) : editingAzure ? (
                      <AzureForm 
                        initialData={editingAzure}
                        onSubmit={handleEditAzure} 
                        onCancel={() => setEditingAzure(null)}
                      />
                    ) : (
                      <AzureList 
                        azureAccounts={azureAccounts} 
                        onEdit={setEditingAzure} 
                        onDelete={handleDeleteAzure}
                      />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="identity">
                  <div className="bg-white rounded-lg border border-border shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-medium">Identity Providers</h2>
                        <p className="text-m365-gray-500 text-sm">Configure authentication for the application</p>
                      </div>
                      
                      <Button onClick={() => setIsAddingProvider(true)} className="gap-2">
                        <Plus size={16} />
                        <span>Add Identity Provider</span>
                      </Button>
                    </div>
                    
                    {isAddingProvider ? (
                      <IdentityProviderForm 
                        onSubmit={handleAddProvider} 
                        onCancel={() => setIsAddingProvider(false)}
                      />
                    ) : editingProvider ? (
                      <IdentityProviderForm 
                        initialData={editingProvider}
                        onSubmit={handleEditProvider} 
                        onCancel={() => setEditingProvider(null)}
                      />
                    ) : (
                      <IdentityProviderList 
                        providers={identityProviders} 
                        onEdit={setEditingProvider} 
                        onDelete={handleDeleteProvider}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;
