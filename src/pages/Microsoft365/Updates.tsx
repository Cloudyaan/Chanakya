
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Microsoft365 from '../Microsoft365';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getTenants, getTenantUpdates } from '@/utils/database';
import { TenantConfig, TenantUpdate } from '@/utils/types';

const getSeverityIcon = (severity?: string) => {
  switch (severity) {
    case 'High':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'Medium':
      return <Info className="h-4 w-4 text-yellow-500" />;
    default:
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
  }
};

const getActionTypeColor = (actionType?: string) => {
  switch (actionType) {
    case 'Action Required':
      return 'bg-red-100 text-red-800';
    case 'Plan for Change':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const Updates = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [updates, setUpdates] = useState<TenantUpdate[]>([]);

  // Load tenants and updates
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load tenants
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
        // Set first tenant as default if available
        if (loadedTenants.length > 0 && !selectedTenantId) {
          setSelectedTenantId(loadedTenants[0].id);
        }
        
        // Load updates for selected tenant or all updates if none selected
        const loadedUpdates = await getTenantUpdates(selectedTenantId);
        setUpdates(loadedUpdates);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load tenant updates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedTenantId, toast]);

  // Handle tenant selection change
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">Message Center Updates</h1>
          <p className="text-m365-gray-500">Stay informed about changes and updates to Microsoft 365 services</p>
        </motion.div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Updates and Messages</CardTitle>
              {tenants.length > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Tenant:</span>
                  <Select value={selectedTenantId} onValueChange={handleTenantChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 border-t-2 border-b-2 border-m365-600 rounded-full animate-spin"></div>
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No updates found for this tenant</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[130px]">Category</TableHead>
                      <TableHead className="w-[150px]">Action</TableHead>
                      <TableHead className="w-[120px] text-right">Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {updates.map((update) => (
                      <TableRow key={update.id} className="group">
                        <TableCell className="py-2">
                          {getSeverityIcon(update.severity)}
                        </TableCell>
                        <TableCell className="font-medium py-3">
                          <div className="cursor-pointer hover:text-m365-600">
                            {update.title}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {update.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{update.category}</TableCell>
                        <TableCell>
                          {update.actionType && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(update.actionType)}`}>
                              {update.actionType}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatDate(update.publishedDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </Microsoft365>
  );
};

export default Updates;
