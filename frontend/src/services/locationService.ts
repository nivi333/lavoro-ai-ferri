import { AuthStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface Location {
  id: string;
  locationId: string;
  name: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  isDefault: boolean;
  isHeadquarters: boolean;
  locationType: 'BRANCH' | 'WAREHOUSE' | 'FACTORY' | 'STORE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Frontend-only optional field for uploaded image preview
  imageUrl?: string;
}

export interface CreateLocationRequest {
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
  isHeadquarters?: boolean;
  isActive?: boolean;
  locationType?: 'BRANCH' | 'WAREHOUSE' | 'FACTORY' | 'STORE';
  imageUrl?: string;
  contactInfo?: Record<string, any>;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  isActive?: boolean;
}

class LocationService {
  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    if (!tokens?.accessToken) {
      throw new Error('No access token available');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    };
  }

  async getLocations(): Promise<Location[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  async getLocationById(id: string): Promise<Location> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch location: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }

  async createLocation(locationData: CreateLocationRequest): Promise<Location> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create location: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async updateLocation(id: string, locationData: UpdateLocationRequest): Promise<Location> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update location: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete location: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
