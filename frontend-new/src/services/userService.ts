import { AuthStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isActive: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  department?: string | null;
  locationId?: string | null;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

export interface InviteUserRequest {
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  password: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department?: string;
  locationId?: string;
}

export interface BulkInviteRequest {
  users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    department?: string;
    locationId?: string;
  }>;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department?: string;
  locationId?: string;
  isActive?: boolean;
}

export type UpdateProfileRequest = UpdateUserRequest;

export interface BulkUpdateRequest {
  userIds: string[];
  role?: string;
  isActive?: boolean;
}

export interface UserActivity {
  id: string;
  type: string;
  timestamp: string;
  createdAt: string;
}

export interface UserDetail extends User {
  sessions: Array<{
    id: string;
    lastActive: string;
    createdAt: string;
  }>;
}

class UserService {
  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    if (!tokens) {
      throw new Error('No authentication tokens found');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    };
  }

  async getCompanyUsers(filters?: UserFilters): Promise<{ users: User[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.department) queryParams.append('department', filters.department);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${API_BASE_URL}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch users');
      }

      return {
        users: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserDetail> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch user');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async inviteUser(data: InviteUserRequest): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/invite`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to invite user');
      }

      return result.data;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  async bulkInviteUsers(data: BulkInviteRequest): Promise<{ success: User[]; failed: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/invite/bulk`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to bulk invite users');
      }

      return result.data;
    } catch (error) {
      console.error('Error bulk inviting users:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(data: BulkUpdateRequest): Promise<{ updated: number; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/bulk/update`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to bulk update users');
      }

      return result.data;
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw error;
    }
  }

  async removeUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove user');
      }

      return result;
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }

  async bulkRemoveUsers(userIds: string[]): Promise<{ removed: number; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/bulk/remove`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to bulk remove users');
      }

      return result.data;
    } catch (error) {
      console.error('Error bulk removing users:', error);
      throw error;
    }
  }

  async getUserActivity(userId: string): Promise<UserActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/activity`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch user activity');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  }

  async updateProfile(data: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        console.warn('Email check API failed, skipping client-side validation');
        return true; // Fallback: allow and let backend validate on submit
      }

      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return true;
    }
  }

  async checkPhoneAvailability(phone: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/check-phone?phone=${encodeURIComponent(phone)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        console.warn('Phone check API failed, skipping client-side validation');
        return true; // Fallback: allow and let backend validate on submit
      }

      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking phone availability:', error);
      return true;
    }
  }
}

export const userService = new UserService();
