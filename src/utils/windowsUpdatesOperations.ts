
import { WindowsUpdate } from './types';
import { API_URL } from './api';

// Windows Updates Operations
export const getWindowsUpdates = async (tenantId?: string): Promise<WindowsUpdate[]> => {
  if (!tenantId) {
    console.error('No tenant ID provided for Windows updates');
    return [];
  }

  try {
    const url = `${API_URL}/windows-updates?tenantId=${tenantId}`;
    
    console.log(`Fetching Windows updates from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Windows updates service returned an error: ${response.status} ${response.statusText}`);
      
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
        
        // If the error is about missing tables or unknown columns, show a specific message
        if (errorData.message && (
            errorData.message.includes('no such table') || 
            errorData.message.includes('no such column'))) {
          console.warn('The Windows updates database tables might not exist yet. Try fetching updates first.');
        }
      } catch (e) {
        console.error('Could not parse error response');
      }
      
      // Return empty array
      return [];
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} Windows updates for tenant ID: ${tenantId}`);
    
    // Map the data to ensure all fields are properly handled
    // This handles different field naming conventions from the API or database
    const mappedUpdates = data.map((update: any) => ({
      id: update.id || '',
      tenantId: tenantId || update.tenantId || update.tenant_id || '',
      productId: update.productId || update.product_id || '',
      productName: update.productName || update.product_name || update.name || '',
      title: update.title || '',
      description: update.description || '',
      webViewUrl: update.webViewUrl || update.web_view_url || '',
      status: update.status || '',
      startDate: update.startDate || update.start_date || update.startDateTime || '',
      resolvedDate: update.resolvedDate || update.resolved_date || update.resolvedDateTime || ''
    }));
    
    // Sort updates by startDate in descending order (newest first)
    return mappedUpdates.sort((a, b) => {
      // Convert dates to timestamps for comparison
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      
      // Sort in descending order (newest first)
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching Windows updates:', error);
    return [];
  }
};

export const fetchWindowsUpdates = async (tenantId: string): Promise<boolean> => {
  if (!tenantId) {
    console.error('No tenant ID provided for fetching Windows updates');
    return false;
  }
  
  try {
    console.log(`Triggering fetch-windows-updates for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-windows-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching Windows updates:', errorData);
      throw new Error(errorData.message || 'Failed to fetch Windows updates');
    }
    
    const result = await response.json();
    console.log('Fetch Windows updates response:', result);
    
    return true;
  } catch (error) {
    console.error('Error triggering Windows update fetch:', error);
    return false;
  }
};
