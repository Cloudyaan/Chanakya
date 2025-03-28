
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Microsoft365 from '../Microsoft365';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TenantUpdate } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState<TenantUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock fetch notifications (in a real app, this would come from an API)
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockNotifications: TenantUpdate[] = [
          {
            id: '1',
            tenantId: 'tenant-001',
            tenantName: 'Contoso Ltd',
            title: 'License expiration warning',
            messageId: 'msg-001',
            description: 'Your Microsoft 365 Business Premium licenses will expire in 15 days. Please renew to avoid service interruption.',
            category: 'Licensing',
            severity: 'High',
            actionType: 'Action Required',
            publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isRead: false
          },
          {
            id: '2',
            tenantId: 'tenant-001',
            tenantName: 'Contoso Ltd',
            title: 'Security alert: Unusual sign-in activity',
            messageId: 'msg-002',
            description: 'We detected unusual sign-in activity for user admin@contoso.com. The sign-in was from an unrecognized location.',
            category: 'Security',
            severity: 'High',
            actionType: 'Action Required',
            publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: true
          },
          {
            id: '3',
            tenantId: 'tenant-001',
            tenantName: 'Contoso Ltd',
            title: 'New feature: Microsoft Teams premium',
            messageId: 'msg-003',
            description: 'Microsoft Teams premium features are now available for your organization. Explore advanced meeting options, enhanced security, and more.',
            category: 'Product Update',
            severity: 'Low',
            actionType: 'Informational',
            publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: false
          },
          {
            id: '4',
            tenantId: 'tenant-001',
            tenantName: 'Contoso Ltd',
            title: 'Planned maintenance: Exchange Online',
            messageId: 'msg-004',
            description: 'Exchange Online will undergo planned maintenance on June 15, 2023, from 2:00 AM to 4:00 AM UTC. Users might experience brief email delivery delays.',
            category: 'Service Health',
            severity: 'Medium',
            actionType: 'Plan for Change',
            publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: true
          },
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [toast]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read",
    });
  };

  const getNotificationIcon = (severity?: string) => {
    switch (severity) {
      case 'High':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'Medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'Low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getActionTypeBadge = (actionType?: string) => {
    switch (actionType) {
      case 'Action Required':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">Action Required</Badge>;
      case 'Plan for Change':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200">Plan for Change</Badge>;
      case 'Informational':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Informational</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const allNotifications = notifications;

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
              <p className="text-m365-gray-500">View notifications and alerts for your Microsoft 365 tenant</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast({
                  title: "All notifications marked as read",
                  description: "All notifications have been marked as read",
                });
              }}
              disabled={unreadNotifications.length === 0}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
          
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="unread">
                Unread
                {unreadNotifications.length > 0 && (
                  <Badge className="ml-2 bg-m365-600">{unreadNotifications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">All Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unread">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-m365-600 mb-4"></div>
                    <p className="text-sm text-gray-500">Loading notifications...</p>
                  </div>
                </div>
              ) : unreadNotifications.length > 0 ? (
                <div className="space-y-4">
                  {unreadNotifications.map((notification) => (
                    <div key={notification.id} className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-medium">{notification.title}</h3>
                            <div className="text-xs text-gray-500">{formatDate(notification.publishedDate)}</div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{notification.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {notification.category && (
                              <Badge variant="outline" className="text-xs">{notification.category}</Badge>
                            )}
                            {getSeverityBadge(notification.severity)}
                            {getActionTypeBadge(notification.actionType)}
                            <div className="flex-grow"></div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                              className="ml-auto text-xs"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Mark as read
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No unread notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-m365-600 mb-4"></div>
                    <p className="text-sm text-gray-500">Loading notifications...</p>
                  </div>
                </div>
              ) : allNotifications.length > 0 ? (
                <div className="space-y-4">
                  {allNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow ${
                        notification.isRead ? '' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-base ${notification.isRead ? 'font-normal' : 'font-medium'}`}>
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-m365-600 px-1.5 py-0.5 text-xs font-medium text-white">
                                  New
                                </span>
                              )}
                            </h3>
                            <div className="text-xs text-gray-500">{formatDate(notification.publishedDate)}</div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{notification.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {notification.category && (
                              <Badge variant="outline" className="text-xs">{notification.category}</Badge>
                            )}
                            {getSeverityBadge(notification.severity)}
                            {getActionTypeBadge(notification.actionType)}
                            {!notification.isRead && (
                              <>
                                <div className="flex-grow"></div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => markAsRead(notification.id)}
                                  className="ml-auto text-xs"
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Mark as read
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                  <p className="text-gray-500">You don't have any notifications yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </Microsoft365>
  );
};

export default Notifications;
