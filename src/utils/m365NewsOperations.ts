
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
    console.log(`Retrieved ${news.length} M365 news items`);
    return news;
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
