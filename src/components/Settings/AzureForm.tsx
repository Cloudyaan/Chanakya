
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AzureConfig } from '@/utils/types';

const azureFormSchema = z.object({
  name: z.string().min(2, {
    message: "Azure account name must be at least 2 characters.",
  }),
  subscriptionId: z.string().min(5, {
    message: "Subscription ID is required and must be at least 5 characters.",
  }),
  tenantId: z.string().min(5, {
    message: "Tenant ID is required and must be at least 5 characters.",
  }),
  clientId: z.string().min(5, {
    message: "Client ID is required and must be at least 5 characters.",
  }),
  clientSecret: z.string().min(8, {
    message: "Client secret is required and must be at least 8 characters.",
  }),
  isActive: z.boolean().default(true),
});

type AzureFormValues = z.infer<typeof azureFormSchema>;

type AzureFormProps = {
  initialData?: AzureConfig;
  onSubmit: (values: AzureFormValues) => void;
  onCancel: () => void;
};

const AzureForm: React.FC<AzureFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<AzureFormValues>({
    resolver: zodResolver(azureFormSchema),
    defaultValues: initialData || {
      name: '',
      subscriptionId: '',
      tenantId: '',
      clientId: '',
      clientSecret: '',
      isActive: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="Contoso Azure" {...field} />
                </FormControl>
                <FormDescription>
                  A friendly name for this Azure account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="subscriptionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription ID</FormLabel>
                <FormControl>
                  <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  The Azure Subscription ID
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant ID</FormLabel>
                <FormControl>
                  <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  The Azure AD Tenant ID
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client ID</FormLabel>
                <FormControl>
                  <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  Azure AD application (client) ID
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="clientSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Secret</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••••••••••" {...field} />
                </FormControl>
                <FormDescription>
                  Client secret for authentication
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this Azure connection
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="gap-2"
          >
            <X size={16} />
            <span>Cancel</span>
          </Button>
          <Button type="submit" className="gap-2">
            <Save size={16} />
            <span>{initialData ? 'Update' : 'Save'} Azure Account</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AzureForm;
