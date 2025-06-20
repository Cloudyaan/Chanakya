
import { API_URL } from './api';
import { M365News } from './types';

export const getM365News = async (tenantId: string): Promise<M365News[]> => {
  try {
    if (!tenantId) {
      console.error('No tenant ID provided to getM365News');
      return [];
    }
    
    console.log(`Fetching M365 news for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/m365-news?tenantId=${tenantId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching M365 news: ${response.status} ${response.statusText}, ${errorText}`);
      
      // Don't throw error, return empty array instead
      return [];
    }
    
    const news: M365News[] = await response.json();
    console.log(`Retrieved ${news.length} M365 news items for tenant ${tenantId}`);
    
    // Log the date formats for debugging
    if (news.length > 0) {
      console.log('Sample M365 news item:', {
        id: news[0].id,
        title: news[0].title,
        published_date: news[0].published_date,
        tenantId: news[0].tenantId
      });
    }
    
    // Handle possible issues with news item structure and ensure proper date formatting
    return news.map(item => ({
      id: item.id || `news-${Math.random().toString(36).substring(2, 11)}`,
      title: item.title || 'Untitled',
      published_date: item.published_date || new Date().toISOString(),
      link: item.link || '',
      summary: item.summary || '',
      categories: Array.isArray(item.categories) ? item.categories : 
                (typeof item.categories === 'string' ? 
                  (JSON.parse(item.categories as any) || []) : []),
      tenantId: item.tenantId || tenantId,
      tenantName: item.tenantName || 'Unknown Tenant',
      fetch_date: item.fetch_date || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error in getM365News:', error);
    return [];
  }
};

export const fetchM365News = async (tenantId: string): Promise<boolean> => {
  try {
    if (!tenantId) {
      console.error('No tenant ID provided to fetchM365News');
      return false;
    }
    
    console.log(`Triggering M365 news fetch for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-m365-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        tenantId,
        skipDatabaseCreation: false,
        forceUseExistingDatabase: true,
        fixCompatibility: true, 
        checkPeriod: true,   
        forceExactDateFilter: true,
        useCompleteDay: true // Use complete day for filtering
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(`Error triggering M365 news fetch: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('M365 news fetch result:', result);
    return true;
  } catch (error) {
    console.error('Error in fetchM365News:', error);
    return false;
  }
};
