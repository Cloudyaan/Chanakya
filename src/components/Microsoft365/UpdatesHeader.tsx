
import React from 'react';
import { TenantConfig } from '@/utils/types';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UpdatesHeaderProps {
  tenants: TenantConfig[];
  selectedTenant: string | null;
  onTenantSelect: (tenantId: string) => void;
  onRefresh: () => void;
  onFetch: () => void;
  isLoading: boolean;
  isFetching: boolean;
}

const UpdatesHeader = ({ 
  tenants, 
  selectedTenant, 
  onTenantSelect, 
  onRefresh, 
  onFetch,
  isLoading,
  isFetching
}: UpdatesHeaderProps) => {
  const activeTenants = tenants.filter(t => t.isActive);
  
  return (
    <div className="flex items-center gap-3 mt-2 sm:mt-0">
      {activeTenants.length > 1 && (
        <Select 
          value={selectedTenant || ''} 
          onValueChange={onTenantSelect}
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
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-1"
      >
        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        Refresh
      </Button>
      
      <Button 
        variant="default" 
        size="sm" 
        onClick={onFetch}
        disabled={isLoading || isFetching || !selectedTenant}
        className="flex items-center gap-1"
      >
        <Download size={16} className={isFetching ? "animate-bounce" : ""} />
        Fetch Updates
      </Button>
    </div>
  );
};

export default UpdatesHeader;
