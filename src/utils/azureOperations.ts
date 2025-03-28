
import { AzureConfig } from './types';
import { API_URL } from './api';

// Azure Account Operations
export const getAzureAccounts = async (): Promise<AzureConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/azure`);
    if (!response.ok) {
      throw new Error('Failed to fetch Azure accounts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Azure accounts:', error);
    return [];
  }
};

export const addAzureAccount = async (account: AzureConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/azure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add Azure account');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding Azure account:', error);
    return false;
  }
};

export const updateAzureAccount = async (account: AzureConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/azure/${account.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update Azure account');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating Azure account:', error);
    return false;
  }
};

export const deleteAzureAccount = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/azure/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete Azure account');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting Azure account:', error);
    return false;
  }
};
