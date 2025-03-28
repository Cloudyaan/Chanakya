
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getTenants } from '@/utils/database';
import { TenantConfig } from '@/utils/types';

const NavBar = () => {
  const location = useLocation();
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  // Fetch tenants on component mount
  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
        // Set first active tenant as default
        const activeTenant = loadedTenants.find(t => t.isActive);
        if (activeTenant) {
          setSelectedTenant(activeTenant.id);
          // Store selected tenant in localStorage for persistence
          localStorage.setItem('selectedTenant', activeTenant.id);
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
      }
    }
    
    // Check if there's a previously selected tenant in localStorage
    const savedTenant = localStorage.getItem('selectedTenant');
    if (savedTenant) {
      setSelectedTenant(savedTenant);
    }
    
    loadTenants();
  }, []);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    localStorage.setItem('selectedTenant', tenantId);
    // Dispatch custom event so other components can react to tenant change
    window.dispatchEvent(new CustomEvent('tenantChanged', { detail: { tenantId } }));
  };

  // Simplified top-level navigation
  const navItems = [
    { name: 'Microsoft 365', path: '/microsoft-365' },
    { name: 'Azure', path: '/azure' },
    { name: 'Settings', path: '/settings' }
  ];

  // Check if we're in a top-level path
  const currentTopLevel = navItems.find(item => 
    location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  );

  // Filter active tenants for the dropdown
  const activeTenants = tenants.filter(t => t.isActive);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/473de01b-dccf-4cb2-8f71-6cc0290460e7.png" 
                alt="Crayon Logo" 
                className="h-12" 
              />
            </Link>
          </div>
          
          <div className="flex items-center overflow-x-auto scrollbar-hide space-x-1">
            {navItems.map((item) => {
              const isActive = currentTopLevel?.path === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-3 py-2 rounded-md text-sm font-medium premium-transition whitespace-nowrap",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onMouseEnter={() => setIsHovering(item.path)}
                  onMouseLeave={() => setIsHovering(null)}
                >
                  {item.name}
                  
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-m365-600 mx-3"
                      layoutId="navbar-indicator"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  
                  {isHovering === item.path && !isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-m365-300 mx-3"
                      layoutId="navbar-hover"
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

          {/* Tenant Selector Dropdown */}
          <div className="flex items-center">
            {activeTenants.length > 1 && (
              <Select 
                value={selectedTenant || ''} 
                onValueChange={handleTenantChange}
              >
                <SelectTrigger className="w-[180px] h-9 bg-white">
                  <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
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
    </nav>
  );
};

export default NavBar;
