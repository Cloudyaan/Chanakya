
import { API_URL } from './api';
import { IdentityProviderConfig } from './types';

// Mock data for development
const MOCK_IDENTITY_PROVIDERS_KEY = 'chanakya_identity_providers';

// Initialize with empty array if not exists
const initMockProviders = () => {
  if (!localStorage.getItem(MOCK_IDENTITY_PROVIDERS_KEY)) {
    localStorage.setItem(MOCK_IDENTITY_PROVIDERS_KEY, JSON.stringify([]));
  }
};

// Get all identity providers
export const getIdentityProviders = async (): Promise<IdentityProviderConfig[]> => {
  try {
    // In a real implementation, this would call the backend API
    // For demo, we'll use localStorage
    initMockProviders();
    const providers = localStorage.getItem(MOCK_IDENTITY_PROVIDERS_KEY);
    return providers ? JSON.parse(providers) : [];
  } catch (error) {
    console.error('Error fetching identity providers:', error);
    return [];
  }
};

// Add a new identity provider
export const addIdentityProvider = async (provider: Omit<IdentityProviderConfig, 'id' | 'dateAdded'>): Promise<boolean> => {
  try {
    initMockProviders();
    const providers = await getIdentityProviders();
    
    const newProvider: IdentityProviderConfig = {
      ...provider,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    
    localStorage.setItem(
      MOCK_IDENTITY_PROVIDERS_KEY, 
      JSON.stringify([...providers, newProvider])
    );
    
    return true;
  } catch (error) {
    console.error('Error adding identity provider:', error);
    return false;
  }
};

// Update an existing identity provider
export const updateIdentityProvider = async (provider: IdentityProviderConfig): Promise<boolean> => {
  try {
    initMockProviders();
    const providers = await getIdentityProviders();
    
    const updatedProviders = providers.map(p => 
      p.id === provider.id ? provider : p
    );
    
    localStorage.setItem(
      MOCK_IDENTITY_PROVIDERS_KEY, 
      JSON.stringify(updatedProviders)
    );
    
    return true;
  } catch (error) {
    console.error('Error updating identity provider:', error);
    return false;
  }
};

// Delete an identity provider
export const deleteIdentityProvider = async (id: string): Promise<boolean> => {
  try {
    initMockProviders();
    const providers = await getIdentityProviders();
    
    const updatedProviders = providers.filter(p => p.id !== id);
    
    localStorage.setItem(
      MOCK_IDENTITY_PROVIDERS_KEY, 
      JSON.stringify(updatedProviders)
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting identity provider:', error);
    return false;
  }
};
