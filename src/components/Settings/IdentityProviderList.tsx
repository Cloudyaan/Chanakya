
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IdentityProviderConfig } from '@/utils/types';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type IdentityProviderListProps = {
  providers: IdentityProviderConfig[];
  onEdit: (provider: IdentityProviderConfig) => void;
  onDelete: (id: string) => void;
};

const IdentityProviderList: React.FC<IdentityProviderListProps> = ({
  providers,
  onEdit,
  onDelete,
}) => {
  const [providerToDelete, setProviderToDelete] = React.useState<IdentityProviderConfig | null>(null);
  
  if (providers.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <h3 className="text-lg font-medium text-muted-foreground">No identity providers configured</h3>
        <p className="text-sm text-muted-foreground mt-1">Add an identity provider to enable authentication</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <div key={provider.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-accent/10">
          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{provider.name}</h3>
              <Badge variant={provider.isEnabled ? "default" : "outline"}>
                {provider.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Tenant ID: {provider.tenantId}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(provider)}>
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setProviderToDelete(provider)}>
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Identity Provider</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {providerToDelete?.name}? 
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setProviderToDelete(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => {
                    if (providerToDelete) {
                      onDelete(providerToDelete.id);
                    }
                    setProviderToDelete(null);
                  }}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IdentityProviderList;
