
import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import NavBar from '@/components/NavBar';

interface Microsoft365Props {
  children?: React.ReactNode;
}

const Microsoft365 = ({ children }: Microsoft365Props) => {
  const location = useLocation();
  const [isHovering, setIsHovering] = React.useState<string | null>(null);
  
  // Subnav items for Microsoft 365
  const subNavItems = [
    { name: 'Dashboard', path: '/microsoft-365/dashboard' },
    { name: 'Licenses', path: '/microsoft-365/licenses' },
    { name: 'M365 DSC', path: '/microsoft-365/dsc' },
    { name: 'Reports', path: '/microsoft-365/reports' }
  ];

  // If we're on the parent route, redirect to the dashboard
  if (location.pathname === '/microsoft-365') {
    return <Navigate to="/microsoft-365/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
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
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default Microsoft365;
