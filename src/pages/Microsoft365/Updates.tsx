
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import { getTenants, getTenantUpdates, fetchTenantUpdates } from '@/utils/database';
import { TenantConfig, TenantUpdate } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, RefreshCw, InfoIcon, ClockIcon, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

const Updates = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [updates, setUpdates] = useState<TenantUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<TenantUpdate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const getBadgeVariant = (actionType: string | undefined) => {
    if (!actionType) return 'default';
    if (actionType === 'Action Required') return 'destructive';
    if (actionType === 'Plan for Change') return 'purple';
    return 'default';
  };

  const getBadgeIcon = (actionType: string | undefined) => {
    if (actionType === 'Action Required') return <AlertTriangle size={12} />;
    return <InfoIcon size={12} />;
  };

  const handleUpdateClick = (update: TenantUpdate) => {
    setSelectedUpdate(update);
    setIsDialogOpen(true);
  };

  // Function to format description with headlines
  const formatDescription = (description: string) => {
    if (!description) return "";
    
    // Split by common headline indicators
    const sections = description.split(/(?:\r?\n){2,}/);
    
    return sections.map((section, index) => {
      // Check if section looks like a headline
      if (section.length < 100 && (section.endsWith(':') || section.toUpperCase() === section)) {
        return <h3 key={index} className="text-base font-semibold mt-4 mb-2">{section}</h3>;
      }
      
      // Check for bullet points
      if (section.trim().startsWith('•') || section.trim().startsWith('-')) {
        const listItems = section.split(/\r?\n/).filter(item => item.trim());
        return (
          <ul key={index} className="list-disc pl-5 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="mb-1">{item.replace(/^[•\-]\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      
      return <p key={index} className="mb-3">{section}</p>;
    });
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
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Message Center Announcements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Action Type</TableHead>
                            <TableHead className="w-[150px]">Category</TableHead>
                            <TableHead className="w-[120px]">ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-[180px] text-right">Last Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {regularUpdates.map((update) => (
                            <TableRow 
                              key={update.id} 
                              className="group hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleUpdateClick(update)}
                            >
                              <TableCell>
                                <Badge 
                                  variant={getBadgeVariant(update.actionType)}
                                  className="flex gap-1 items-center"
                                >
                                  {getBadgeIcon(update.actionType)}
                                  {update.actionType || 'Informational'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {update.actionType === 'Plan for Change' ? (
                                  <Badge variant="purple" className="flex gap-1 items-center">
                                    {update.category || 'General'}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    {update.category || 'General'}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {update.messageId || update.id}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{update.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1 group-hover:line-clamp-2 transition-all duration-300">
                                  {update.description}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                  <ClockIcon size={14} />
                                  <span className="text-sm">{formatDate(update.publishedDate)}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
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

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    {selectedUpdate && (
                      <>
                        <DialogHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={getBadgeVariant(selectedUpdate.actionType)}
                              className="flex gap-1 items-center"
                            >
                              {getBadgeIcon(selectedUpdate.actionType)}
                              {selectedUpdate.actionType || 'Informational'}
                            </Badge>
                            {selectedUpdate.actionType === 'Plan for Change' ? (
                              <Badge variant="purple" className="flex gap-1 items-center">
                                {selectedUpdate.category || 'General'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {selectedUpdate.category || 'General'}
                              </Badge>
                            )}
                          </div>
                          <DialogTitle className="text-xl">
                            {selectedUpdate.title}
                          </DialogTitle>
                          <DialogDescription className="flex justify-between items-center mt-2">
                            <span className="font-mono text-xs">
                              ID: {selectedUpdate.messageId || selectedUpdate.id}
                            </span>
                            <span className="text-sm flex items-center gap-1">
                              <ClockIcon size={14} />
                              Last updated: {formatDate(selectedUpdate.publishedDate)}
                            </span>
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4 prose prose-sm max-w-none">
                          {formatDescription(selectedUpdate.description)}
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Close
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </main>
    </Microsoft365>
  );
};

export default Updates;
