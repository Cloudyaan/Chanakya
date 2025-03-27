
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { AzureConfig } from '@/utils/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface AzureListProps {
  azureAccounts: AzureConfig[];
  onEdit: (azureAccount: AzureConfig) => void;
  onDelete: (id: string) => void;
}

const AzureList: React.FC<AzureListProps> = ({
  azureAccounts,
  onEdit,
  onDelete,
}) => {
  if (azureAccounts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-gray-50">
        <h3 className="text-lg font-medium text-gray-500">No Azure Accounts</h3>
        <p className="text-gray-400 mt-1">Add your first Azure account to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead>Subscription ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {azureAccounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>{account.subscriptionId}</TableCell>
              <TableCell>
                {account.isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(account)}
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(account.id)}
                    title="Delete"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AzureList;
