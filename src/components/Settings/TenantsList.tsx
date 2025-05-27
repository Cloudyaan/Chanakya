
import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { TenantConfig } from '@/utils/types';

type TenantsListProps = {
  tenants: TenantConfig[];
  onEdit: (tenant: TenantConfig) => void;
  onDelete: (id: string) => void;
};

const TenantsList: React.FC<TenantsListProps> = ({
  tenants,
  onEdit,
  onDelete,
}) => {
  const [tenantToDelete, setTenantToDelete] = useState<TenantConfig | null>(null);

  const handleDeleteConfirm = () => {
    if (tenantToDelete) {
      onDelete(tenantToDelete.id);
      setTenantToDelete(null);
    }
  };

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-md border-border">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No tenants configured</h3>
        <p className="text-sm text-gray-400 mb-4">Add your first Microsoft 365 tenant to begin.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Tenant ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.tenantId}</TableCell>
                <TableCell>
                  {tenant.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Disabled
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(tenant.dateAdded).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(tenant)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Edit</span>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTenantToDelete(tenant)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <span className="sr-only">Delete</span>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tenant Configuration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the tenant configuration for "{tenant.name}"?
                            This action will permanently remove all associated data and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setTenantToDelete(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default TenantsList;
