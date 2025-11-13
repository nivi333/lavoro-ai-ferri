const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  isHeadquarters: boolean;
  locationType: 'HEADQUARTERS' | 'BRANCH' | 'WAREHOUSE' | 'FACTORY';
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  email?: string;
  phone?: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  isHeadquarters?: boolean;
  locationType?: 'HEADQUARTERS' | 'BRANCH' | 'WAREHOUSE' | 'FACTORY';
  imageUrl?: string;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  isActive?: boolean;
}

class LocationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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
      return data.locations || [];
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
      return data.location;
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
      return data.location;
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
      return data.location;
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

  async setDefaultLocation(id: string): Promise<Location> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/${id}/set-default`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to set default location: ${response.statusText}`);
      }

      const data = await response.json();
      return data.location;
    } catch (error) {
      console.error('Error setting default location:', error);
      throw error;
    }
  }

  async setHeadquarters(id: string): Promise<Location> {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/${id}/set-headquarters`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to set headquarters: ${response.statusText}`);
      }

      const data = await response.json();
      return data.location;
    } catch (error) {
      console.error('Error setting headquarters:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
