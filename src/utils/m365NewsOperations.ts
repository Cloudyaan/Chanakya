
import { API_URL } from './api';
import { M365News } from './types';

export const getM365News = async (tenantId: string): Promise<M365News[]> => {
  try {
    console.log(`Fetching M365 news for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/m365-news?tenantId=${tenantId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching M365 news: ${response.statusText}`);
    }
    
    const news: M365News[] = await response.json();
    console.log(`Retrieved ${news.length} M365 news items:`, news);
    
    // Handle possible issues with news item structure
    return news.map(item => ({
      id: item.id || `news-${Math.random().toString(36).substring(2, 11)}`,
      title: item.title || 'Untitled',
      published_date: item.published_date || new Date().toISOString(),
      link: item.link || '',
      summary: item.summary || '',
      categories: Array.isArray(item.categories) ? item.categories : [],
      tenantId: item.tenantId || tenantId,
      tenantName: item.tenantName || 'Unknown Tenant',
      fetch_date: item.fetch_date || new Date().toISOString() // Add the missing fetch_date property
    }));
  } catch (error) {
    console.error('Error in getM365News:', error);
    return [];
  }
};

export const fetchM365News = async (tenantId: string): Promise<boolean> => {
  try {
    console.log(`Triggering M365 news fetch for tenant: ${tenantId}`);
    const response = await fetch(`${API_URL}/fetch-m365-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
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
