
import React, { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import NavBar from '@/components/NavBar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTenantCache } from '@/hooks/useTenantCache';
import { TenantConfig } from '@/utils/types';

interface Microsoft365Props {
  children?: React.ReactNode;
}

const Microsoft365 = ({ children }: Microsoft365Props) => {
  const location = useLocation();
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const { tenants } = useTenantCache();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Updated subnav items without Licenses and M365 DSC
  const subNavItems = [
    { name: 'Dashboard', path: '/microsoft-365/dashboard' },
    { name: 'Updates', path: '/microsoft-365/updates' },
    { name: 'Reports', path: '/microsoft-365/reports' },
    { name: 'Notifications', path: '/microsoft-365/notifications' }
  ];

  // Add scroll event listener to detect when the page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize selected tenant from localStorage or first active tenant
  useEffect(() => {
    if (tenants.length > 0) {
      // Check if there's a previously selected tenant in localStorage
      const savedTenant = localStorage.getItem('selectedTenant');
      if (savedTenant) {
        const tenantExists = tenants.find(t => t.id === savedTenant && t.isActive);
        if (tenantExists) {
          setSelectedTenant(savedTenant);
          return;
        }
      }
      
      // Set first active tenant as default if no saved tenant
      const activeTenant = tenants.find(t => t.isActive);
      if (activeTenant) {
        setSelectedTenant(activeTenant.id);
        localStorage.setItem('selectedTenant', activeTenant.id);
      }
    }
  }, [tenants]);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    localStorage.setItem('selectedTenant', tenantId);
    // Dispatch custom event so other components can react to tenant change
    window.dispatchEvent(new CustomEvent('tenantChanged', { detail: { tenantId } }));
  };

  // If we're on the parent route, redirect to the dashboard
  if (location.pathname === '/microsoft-365') {
    return <Navigate to="/microsoft-365/dashboard" />;
  }

  // Filter active tenants for the dropdown
  const activeTenants = tenants.filter(t => t.isActive);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="sticky top-16 border-b z-10 bg-background transition-all duration-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center">
            <div className="flex overflow-x-auto scrollbar-hide space-x-1">
              {subNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative px-3 py-3 text-sm font-medium premium-transition whitespace-nowrap",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    onMouseEnter={() => setIsHovering(item.path)}
                    onMouseLeave={() => setIsHovering(null)}
                  >
                    {item.name}
                    
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-m365-600 mx-3"
                        layoutId="subnav-indicator"
                        initial={false}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    
                    {isHovering === item.path && !isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-m365-300 mx-3"
                        layoutId="subnav-hover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Tenant Selector Dropdown on right side */}
            <div className="ml-auto">
              {activeTenants.length > 0 && (
                <Select 
                  value={selectedTenant || ''} 
                  onValueChange={handleTenantChange}
                >
                  <SelectTrigger className="w-[180px] h-9 bg-white">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {activeTenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default Microsoft365;
