
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
        <div className="flex h-16 items-center">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/473de01b-dccf-4cb2-8f71-6cc0290460e7.png" 
                alt="Crayon Logo" 
                className="h-12" 
              />
            </Link>
          </div>
          
          {/* Centered navigation */}
          <div className="flex-grow flex justify-center">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = currentTopLevel?.path === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium premium-transition whitespace-nowrap rounded-md",
                      isActive 
                        ? "text-foreground bg-secondary/50" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
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
          </div>
          
          {/* Right area for future components */}
          <div className="flex-shrink-0">
            {/* Placeholder for future components */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
