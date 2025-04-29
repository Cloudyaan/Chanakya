
import { API_URL } from './api';
import { IdentityProviderConfig } from './types';

// Get all identity providers
export const getIdentityProviders = async (): Promise<IdentityProviderConfig[]> => {
  try {
    // Use the main API to fetch identity providers
    const response = await fetch(`${API_URL}/identity-providers`);
    if (!response.ok) {
      throw new Error('Failed to fetch identity providers');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching identity providers:', error);
    return [];
  }
};

// Add a new identity provider
export const addIdentityProvider = async (provider: Omit<IdentityProviderConfig, 'id' | 'dateAdded'>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/identity-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...provider,
        dateAdded: new Date().toISOString()
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add identity provider');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding identity provider:', error);
    return false;
  }
};

// Update an existing identity provider
export const updateIdentityProvider = async (provider: IdentityProviderConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/identity-providers/${provider.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(provider),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update identity provider');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating identity provider:', error);
    return false;
  }
};

// Delete an identity provider
export const deleteIdentityProvider = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/identity-providers/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete identity provider');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting identity provider:', error);
    return false;
  }
};
