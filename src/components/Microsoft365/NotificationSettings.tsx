import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { X, Edit, Trash2, Plus, Mail, Bell, Save, Send, Calendar, Clock } from 'lucide-react';
import { 
  getNotificationSettings, 
  addNotificationSetting, 
  updateNotificationSetting,
  deleteNotificationSetting,
  sendNotificationNow
} from '@/utils/notificationOperations';
import { TenantConfig, NotificationSetting } from '@/utils/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  tenants: z.array(z.string()).min(1, { message: 'Select at least one tenant' }),
  update_types: z.array(z.string()).min(1, { message: 'Select at least one update type' }),
  frequency: z.enum(['Daily', 'Weekly'])
});

type FormValues = z.infer<typeof formSchema>;

interface NotificationSettingsProps {
  tenants: TenantConfig[];
  selectedTenant: string | null;
}

const NotificationSettings = ({ tenants, selectedTenant }: NotificationSettingsProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FormValues> | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      tenants: selectedTenant ? [selectedTenant] : [],
      update_types: [],
      frequency: 'Weekly'
    }
  });

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await getNotificationSettings(selectedTenant || undefined);
      console.log('Loaded notification settings:', settings);
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    if (selectedTenant) {
      form.setValue('tenants', [selectedTenant]);
    }
  }, [selectedTenant]);

  const onSubmit = async (data: FormValues) => {
    try {
      const settingData = {
        name: data.name,
        email: data.email,
        tenants: data.tenants,
        update_types: data.update_types,
        frequency: data.frequency
      };
      
      const result = await addNotificationSetting(settingData);
      if (result.success) {
        toast.success('Notification setting created successfully');
        form.reset();
        setIsCreating(false);
        loadSettings();
      } else {
        toast.error(result.message || 'Failed to create notification setting');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while creating the notification setting');
    }
  };

  const handleEdit = (setting: NotificationSetting) => {
    setIsEditing(setting.id);
    setEditValues({
      tenants: Array.isArray(setting.tenants) ? setting.tenants : [],
      update_types: Array.isArray(setting.update_types) ? setting.update_types : [],
      frequency: setting.frequency
    });
  };

  const handleSendNow = async (id: string) => {
    setIsSending(id);
    try {
      const result = await sendNotificationNow(id);
      if (result.success) {
        toast.success('Notification sent successfully');
      } else {
        toast.error(result.message || 'Failed to send notification');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while sending the notification');
    } finally {
      setIsSending(null);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValues) return;

    try {
      const result = await updateNotificationSetting(id, editValues);
      if (result.success) {
        toast.success('Notification setting updated successfully');
        setIsEditing(null);
        setEditValues(null);
        loadSettings();
      } else {
        toast.error(result.message || 'Failed to update notification setting');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while updating the notification setting');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification setting?')) {
      return;
    }

    try {
      const result = await deleteNotificationSetting(id);
      if (result.success) {
        toast.success('Notification setting deleted successfully');
        loadSettings();
      } else {
        toast.error(result.message || 'Failed to delete notification setting');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while deleting the notification setting');
    }
  };

  const updateTypes = [
    { id: 'message-center', label: 'Message Center' },
    { id: 'windows-updates', label: 'Windows Updates' },
    { id: 'news', label: 'Microsoft 365 News' }
  ];

  const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Notification Settings</CardTitle>
            <CardDescription>Configure email notifications for Microsoft 365 updates</CardDescription>
          </div>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? "secondary" : "default"}
            size="sm"
            className="flex items-center gap-1"
          >
            {isCreating ? (
              <>
                <X size={16} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} />
                New Notification
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <div className="mb-8 border p-4 rounded-lg bg-slate-50">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Bell size={18} />
                Create New Notification
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Notification name" {...field} />
                          </FormControl>
                          <FormDescription>
                            A name to identify this notification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email address" {...field} />
                          </FormControl>
                          <FormDescription>
                            Email address to receive notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tenants"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>Tenants</FormLabel>
                          <FormDescription>
                            Select which tenants to receive updates from
                          </FormDescription>
                        </div>
                        <div className="space-y-2">
                          {tenants.filter(t => t.isActive).map((tenant) => (
                            <FormItem
                              key={tenant.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={form.watch('tenants').includes(tenant.id)}
                                  onCheckedChange={(checked) => {
                                    const currentTenants = form.watch('tenants');
                                    if (checked) {
                                      form.setValue('tenants', [...currentTenants, tenant.id]);
                                    } else {
                                      form.setValue(
                                        'tenants',
                                        currentTenants.filter((id) => id !== tenant.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {tenant.name}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="update_types"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>Update Types</FormLabel>
                          <FormDescription>
                            Select which types of updates to receive
                          </FormDescription>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {updateTypes.map((type) => (
                            <FormItem
                              key={type.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={form.watch('update_types').includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    const currentTypes = form.watch('update_types');
                                    if (checked) {
                                      form.setValue('update_types', [...currentTypes, type.id]);
                                    } else {
                                      form.setValue(
                                        'update_types',
                                        currentTypes.filter((id) => id !== type.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {type.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often to receive notification emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Notification</Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : notificationSettings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tenants</TableHead>
                  <TableHead>Update Types</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.name}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Mail size={14} />
                      {setting.email}
                    </TableCell>
                    <TableCell>
                      {isEditing === setting.id ? (
                        <div className="max-h-32 overflow-y-auto">
                          {tenants.filter(t => t.isActive).map((tenant) => (
                            <div key={tenant.id} className="flex items-center space-x-2 mb-1">
                              <Checkbox
                                checked={(editValues?.tenants || []).includes(tenant.id)}
                                onCheckedChange={(checked) => {
                                  const currentTenants = editValues?.tenants || [];
                                  if (checked) {
                                    setEditValues({
                                      ...editValues,
                                      tenants: [...currentTenants, tenant.id]
                                    });
                                  } else {
                                    setEditValues({
                                      ...editValues,
                                      tenants: currentTenants.filter((id) => id !== tenant.id)
                                    });
                                  }
                                }}
                              />
                              <label className="text-sm">{tenant.name}</label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {ensureArray(setting.tenants).map((tenantId) => {
                            const tenant = tenants.find(t => t.id === tenantId);
                            return tenant ? (
                              <span key={tenantId} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-1 mb-1">
                                {tenant.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === setting.id ? (
                        <div>
                          {updateTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2 mb-1">
                              <Checkbox
                                checked={(editValues?.update_types || []).includes(type.id)}
                                onCheckedChange={(checked) => {
                                  const currentTypes = editValues?.update_types || [];
                                  if (checked) {
                                    setEditValues({
                                      ...editValues,
                                      update_types: [...currentTypes, type.id]
                                    });
                                  } else {
                                    setEditValues({
                                      ...editValues,
                                      update_types: currentTypes.filter((id) => id !== type.id)
                                    });
                                  }
                                }}
                              />
                              <label className="text-sm">{type.label}</label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {ensureArray(setting.update_types).map((typeId) => {
                            const type = updateTypes.find(t => t.id === typeId);
                            return type ? (
                              <span key={typeId} className="inline-block bg-blue-100 px-2 py-1 rounded text-xs mr-1 mb-1">
                                {type.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === setting.id ? (
                        <Select
                          value={editValues?.frequency || setting.frequency}
                          onValueChange={(value) => setEditValues({
                            ...editValues,
                            frequency: value as 'Daily' | 'Weekly'
                          })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          {setting.frequency === 'Daily' && <Clock size={14} />}
                          {setting.frequency === 'Weekly' && <Calendar size={14} />}
                          <span className="inline-block bg-green-100 px-2 py-1 rounded text-xs">
                            {setting.frequency}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing === setting.id ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditing(null);
                              setEditValues(null);
                            }}
                          >
                            <X size={14} />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveEdit(setting.id)}
                          >
                            <Save size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendNow(setting.id)}
                            disabled={isSending === setting.id}
                            className="flex items-center gap-1"
                          >
                            {isSending === setting.id ? (
                              <span className="animate-spin h-3 w-3 border-2 border-b-transparent rounded-full" />
                            ) : (
                              <Send size={14} />
                            )}
                            <span>Send Now</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(setting.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Notification Settings</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any notification settings yet. Click the "New Notification" button to create one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
