
import { API_URL } from './api';
import { IdentityProviderConfig } from './types';

// Get all identity providers from the database
export const getIdentityProviders = async (): Promise<IdentityProviderConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/identity-providers`);
    if (!response.ok) {
      throw new Error(`Failed to fetch identity providers: ${response.status}`);
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
      body: JSON.stringify(provider),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add identity provider: ${response.status}`);
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
      throw new Error(`Failed to update identity provider: ${response.status}`);
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
      throw new Error(`Failed to delete identity provider: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting identity provider:', error);
    return false;
  }
};

// Get the auth redirect URL - ensures it matches what we expect
export const getAuthRedirectUrl = (): string => {
  return `${window.location.origin}/auth/callback`;
};

// Validate the redirect URI in the provider config
export const validateProviderConfig = (provider: IdentityProviderConfig): boolean => {
  const expectedRedirectUri = getAuthRedirectUrl();
  return provider.redirectUri === expectedRedirectUri;
};
