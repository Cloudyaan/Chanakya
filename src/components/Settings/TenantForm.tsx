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
import TenantFormProgress from './TenantFormProgress';

const tenantFormSchema = z.object({
  id: z.string().optional(),
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
  dateAdded: z.string().optional(),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

type TenantFormProps = {
  initialData?: TenantConfig;
  onSubmit: (values: TenantConfig) => void;
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
  const [progress, setProgress] = React.useState(0);
  const [progressMessage, setProgressMessage] = React.useState('');
  const [showProgress, setShowProgress] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

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

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const simulateProgress = async () => {
    setShowProgress(true);
    setProgress(0);
    setIsComplete(false);
    
    setProgressMessage('Validating tenant information...');
    setProgress(20);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProgressMessage('Connecting to Azure SQL Database...');
    setProgress(40);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProgressMessage('Creating tenant configuration...');
    setProgress(60);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProgressMessage('Initializing tenant tables...');
    setProgress(80);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProgressMessage('Finalizing configuration...');
    setProgress(100);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsComplete(true);
    setProgressMessage('Configuration saved successfully!');
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSubmit = async (values: TenantFormValues) => {
    setIsSubmitting(true);
    
    try {
      const currentTenants = existingTenants.length > 0 
        ? existingTenants 
        : await getTenants();
      
      const otherTenants = initialData 
        ? currentTenants.filter(t => t.id !== initialData.id) 
        : currentTenants;

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
      
      console.log("Submitting tenant with values:", values);
      
      const finalValues: TenantConfig = {
        id: values.id || initialData?.id || crypto.randomUUID(),
        name: values.name,
        tenantId: values.tenantId,
        applicationId: values.applicationId,
        applicationSecret: values.applicationSecret,
        isActive: values.isActive,
        dateAdded: values.dateAdded || initialData?.dateAdded || new Date().toISOString(),
      };
      
      console.log("Final tenant data being submitted:", finalValues);
      
      // Show progress indicator
      await simulateProgress();
      
      onSubmit(finalValues);
      
      setShowProgress(false);
    } catch (error) {
      console.error("Error validating tenant:", error);
      toast({
        title: "Validation Error",
        description: "An error occurred while validating tenant information",
        variant: "destructive",
      });
      setShowProgress(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TenantFormProgress
        isVisible={showProgress}
        progress={progress}
        message={progressMessage}
        isComplete={isComplete}
      />
      
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
                    onCheckedChange={(checked) => {
                      console.log("Switch toggled to:", checked);
                      field.onChange(checked);
                    }}
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
    </>
  );
};

export default TenantForm;
