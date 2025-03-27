
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const NavBar = () => {
  const location = useLocation();
  const [isHovering, setIsHovering] = useState<string | null>(null);

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

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-m365-600 rounded flex items-center justify-center">
                <span className="text-white font-semibold text-sm">CH</span>
              </div>
              <span className="text-foreground font-semibold text-lg">Chanakya</span>
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

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md focus-ring premium-transition hover:bg-gray-100">
              <span className="sr-only">Notifications</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-m365-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            <div className="h-6 w-px bg-border"></div>
            
            <button className="flex items-center text-sm font-medium text-foreground premium-transition focus-ring rounded-full">
              <div className="h-8 w-8 rounded-full bg-m365-100 flex items-center justify-center text-m365-700">
                <span>AC</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
