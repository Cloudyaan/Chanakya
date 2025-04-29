
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
import { IdentityProviderConfig } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const identityProviderFormSchema = z.object({
  name: z.string().min(2, {
    message: "Provider name must be at least 2 characters.",
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
  redirectUri: z.string().url({
    message: "Must be a valid URL.",
  }),
  isEnabled: z.boolean().default(false),
});

type IdentityProviderFormValues = z.infer<typeof identityProviderFormSchema>;

type IdentityProviderFormProps = {
  initialData?: IdentityProviderConfig;
  onSubmit: (values: IdentityProviderFormValues) => void;
  onCancel: () => void;
};

const IdentityProviderForm: React.FC<IdentityProviderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  
  const form = useForm<IdentityProviderFormValues>({
    resolver: zodResolver(identityProviderFormSchema),
    defaultValues: initialData || {
      name: 'Microsoft Entra ID',
      tenantId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: window.location.origin + '/auth/callback',
      isEnabled: false,
    },
  });

  const handleSubmit = (values: IdentityProviderFormValues) => {
    console.log('Submitting form with values:', values);
    
    // If this is an update (initialData exists), make sure we include the ID
    if (initialData?.id) {
      const updatedValues = {
        ...values,
        id: initialData.id,
        dateAdded: initialData.dateAdded,
      };
      onSubmit(updatedValues as any);
    } else {
      onSubmit(values);
    }
    
    toast({
      title: initialData ? 'Identity provider updated' : 'Identity provider added',
      description: `Successfully ${initialData ? 'updated' : 'added'} ${values.name}`,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider Name</FormLabel>
                <FormControl>
                  <Input placeholder="Microsoft Entra ID" {...field} />
                </FormControl>
                <FormDescription>
                  A friendly name for this identity provider
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
                  The Entra ID Tenant ID
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
                  Application (client) ID from Entra ID registration
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
          
          <FormField
            control={form.control}
            name="redirectUri"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Redirect URI</FormLabel>
                <FormControl>
                  <Input placeholder="https://your-app.com/auth/callback" {...field} />
                </FormControl>
                <FormDescription>
                  Authentication callback URL (must match Entra ID app configuration)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Authentication</FormLabel>
                <FormDescription>
                  Turn on authentication for this application
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
            <span>{initialData ? 'Update' : 'Save'} Identity Provider</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default IdentityProviderForm;
