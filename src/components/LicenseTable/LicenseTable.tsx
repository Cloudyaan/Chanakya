
import React, { useState } from 'react';
import { License } from '@/utils/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LicenseTableProps {
  licenses: License[];
  className?: string;
}

const LicenseTable: React.FC<LicenseTableProps> = ({ licenses, className }) => {
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      className={cn(
        "bg-white rounded-xl shadow-soft border border-border overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">Microsoft 365 Licenses</h2>
        <p className="text-sm text-m365-gray-500">Manage and monitor your organization's license usage</p>
      </div>
      
      <div className="overflow-x-auto">
        <motion.table 
          className="w-full" 
          variants={container}
          initial="hidden"
          animate="show"
        >
          <thead>
            <tr className="bg-m365-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-m365-gray-500 uppercase tracking-wider">License</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-m365-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-m365-gray-500 uppercase tracking-wider">Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-m365-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-m365-gray-500 uppercase tracking-wider">Utilization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-m365-gray-500 uppercase tracking-wider">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {licenses.map((license) => {
              const utilization = (license.usedCount / license.totalCount) * 100;
              const isSelected = selectedLicense === license.id;
              
              return (
                <React.Fragment key={license.id}>
                  <motion.tr 
                    variants={item}
                    className={cn(
                      "premium-transition hover:bg-m365-50 cursor-pointer",
                      isSelected && "bg-m365-50"
                    )}
                    onClick={() => setSelectedLicense(isSelected ? null : license.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-medium text-foreground">{license.displayName}</div>
                          <div className="text-xs text-m365-gray-500">{license.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{license.totalCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{license.usedCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{license.availableCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-m365-100 rounded-full h-2 mr-2">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              utilization > 90 ? "bg-amber-500" : "bg-m365-600"
                            )}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className="text-xs">{utilization.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {license.renewalDate ? new Date(license.renewalDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </motion.tr>
                  
                  {isSelected && (
                    <motion.tr 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={6} className="px-6 py-4 bg-m365-50">
                        <div className="text-sm">
                          <p className="font-medium mb-2">License Details</p>
                          {license.description && (
                            <p className="text-m365-gray-600 mb-2">{license.description}</p>
                          )}
                          
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-m365-gray-500">Price</p>
                              <p className="font-medium">{license.price ? `${license.price} ${license.currency}/month` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-m365-gray-500">SKU ID</p>
                              <p className="font-medium">{license.sku}</p>
                            </div>
                            <div>
                              <p className="text-xs text-m365-gray-500">Renewal Date</p>
                              <p className="font-medium">{license.renewalDate ? new Date(license.renewalDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                          
                          {license.includedServices && license.includedServices.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-m365-gray-500 mb-2">Included Services</p>
                              <div className="flex flex-wrap gap-2">
                                {license.includedServices.map((service, index) => (
                                  <span 
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-m365-100 text-m365-800"
                                  >
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </motion.table>
      </div>
    </motion.div>
  );
};

export default LicenseTable;
