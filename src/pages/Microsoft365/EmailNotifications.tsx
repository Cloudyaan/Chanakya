
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmailNotifications = () => {
  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-foreground">Email Notifications</h1>
        <p className="text-m365-gray-500">Configure email notifications for Microsoft 365 events</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <Card className="col-span-1 lg:col-span-2 shadow-soft border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-m365-600" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>Configure when and how you receive email notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="license" className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="license" className="flex-1">License Notifications</TabsTrigger>
                <TabsTrigger value="updates" className="flex-1">Update Notifications</TabsTrigger>
                <TabsTrigger value="security" className="flex-1">Security Alerts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="license" className="p-4 border rounded-md">
                <p className="text-muted-foreground text-center py-8">
                  License notification settings will be implemented in a future update.
                </p>
              </TabsContent>
              
              <TabsContent value="updates" className="p-4 border rounded-md">
                <p className="text-muted-foreground text-center py-8">
                  Update notification settings will be implemented in a future update.
                </p>
              </TabsContent>
              
              <TabsContent value="security" className="p-4 border rounded-md">
                <p className="text-muted-foreground text-center py-8">
                  Security alert settings will be implemented in a future update.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadow-soft border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-m365-600" />
              <span>Recipient Configuration</span>
            </CardTitle>
            <CardDescription>Manage email recipients and schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-center py-8">
              Email recipient configuration will be implemented in a future update.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
};

export default EmailNotifications;
