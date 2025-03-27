
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
import { TenantConfig } from '@/utils/types';
import { getTenants } from '@/utils/database';
import { useToast } from '@/hooks/use-toast';

const tenantFormSchema = z.object({
  name: z.string()
    .min(3, {
      message: "Tenant name must be at least 3 characters.",
    })
    .max(15, {
      message: "Tenant name must not exceed 15 characters.",
    })
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: "Tenant name can only contain letters, numbers, dots (.), underscores (_), or hyphens (-).",
    }),
  tenantId: z.string().min(5, {
    message: "Tenant ID is required and must be at least 5 characters.",
  }),
  applicationId: z.string().min(5, {
    message: "Application ID is required and must be at least 5 characters.",
  }),
  applicationSecret: z.string().min(8, {
    message: "Application secret is required and must be at least 8 characters.",
  }),
  isActive: z.boolean().default(true),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

type TenantFormProps = {
  initialData?: TenantConfig;
  onSubmit: (values: TenantFormValues) => void;
  onCancel: () => void;
  existingTenants?: TenantConfig[];
};

const TenantForm: React.FC<TenantFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  existingTenants = [],
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: initialData || {
      name: '',
      tenantId: '',
      applicationId: '',
      applicationSecret: '',
      isActive: true,
    },
  });

  const handleSubmit = async (values: TenantFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Get the latest tenants data to check for duplicates
      const currentTenants = existingTenants.length > 0 
        ? existingTenants 
        : await getTenants();
      
      // Filter out the current tenant when editing
      const otherTenants = initialData 
        ? currentTenants.filter(t => t.id !== initialData.id) 
        : currentTenants;

      // Check for duplicate tenant name
      const duplicateName = otherTenants.find(
        tenant => tenant.name.toLowerCase() === values.name.toLowerCase()
      );
      
      if (duplicateName) {
        toast({
          title: "Validation Error",
          description: `A tenant with the name "${values.name}" already exists.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check for duplicate tenant ID
      const duplicateTenantId = otherTenants.find(
        tenant => tenant.tenantId === values.tenantId
      );
      
      if (duplicateTenantId) {
        toast({
          title: "Validation Error",
          description: `A tenant with the ID "${values.tenantId}" already exists.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // All validations passed, submit the form
      onSubmit(values);
    } catch (error) {
      console.error("Error validating tenant:", error);
      toast({
        title: "Validation Error",
        description: "An error occurred while validating tenant information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <FormLabel>Tenant Name</FormLabel>
                <FormControl>
                  <Input placeholder="Contoso Corp" {...field} />
                </FormControl>
                <FormDescription>
                  A friendly name for this tenant (3-15 chars, alphanumeric with ., _, -)
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
                  The Microsoft 365 Tenant ID (Directory ID)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="applicationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application ID</FormLabel>
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
            name="applicationSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Secret</FormLabel>
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
                  Enable or disable this tenant connection
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
            disabled={isSubmitting}
          >
            <X size={16} />
            <span>Cancel</span>
          </Button>
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            <Save size={16} />
            <span>{initialData ? 'Update' : 'Save'} Tenant</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TenantForm;
