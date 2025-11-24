import { AuthStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface CreateCompanyRequest {
  name: string;
  slug?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  country: string;
  defaultLocation: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  establishedDate?: string;
  businessType: string;
  certifications?: string[];
  contactInfo: string;
  website?: string;
  taxId?: string;
  isActive?: boolean; // Always true for company creation
}

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  country?: string;
  defaultLocation?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  establishedDate?: string;
  businessType?: string;
  certifications?: string;
  contactInfo?: string;
  website?: string;
  taxId?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDetails extends CompanyResponse {
  userRole?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  slug?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  country?: string;
  defaultLocation?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  establishedDate?: string;
  businessType?: string;
  certifications?: string;
  contactInfo?: string;
  website?: string;
  taxId?: string;
  isActive?: boolean;
}

class CompanyService {
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

  async createCompany(data: CreateCompanyRequest): Promise<CompanyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create company');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/check-slug?slug=${encodeURIComponent(slug)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        // If API fails, fall back to client-side validation
        console.warn('Slug check API failed, using client-side validation');
        const reservedSlugs = ['admin', 'api', 'www', 'app', 'dashboard', 'login', 'register'];
        return !reservedSlugs.includes(slug.toLowerCase());
      }

      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      // Fallback to client-side validation
      const reservedSlugs = ['admin', 'api', 'www', 'app', 'dashboard', 'login', 'register'];
      return !reservedSlugs.includes(slug.toLowerCase());
    }
  }

  async updateCompany(tenantId: string, data: UpdateCompanyRequest): Promise<CompanyDetails> {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update company');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async getCompany(tenantId: string): Promise<CompanyDetails> {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch company');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  async getCompanyLogo(tenantId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}/logo`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.logoUrl || null;
    } catch (error) {
      console.error('Error fetching company logo:', error);
      return null; // Return null on error to avoid breaking UI
    }
  }

  async inviteUser(companyId: string, inviteData: {
    emailOrPhone: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    companyId: string;
    locationId?: string;
  }): Promise<any> {
    try {
      const payload = {
        emailOrPhone: inviteData.emailOrPhone,
        role: inviteData.role,
        companyId: inviteData.companyId,
        locationId: inviteData.locationId,
      };

      console.log('=== COMPANY SERVICE INVITE DEBUG ===');
      console.log('companyId parameter:', companyId);
      console.log('inviteData parameter:', inviteData);
      console.log('final payload:', payload);
      console.log('API URL:', `${API_BASE_URL}/companies/${companyId}/invite`);

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/invite`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        console.error('API error response:', result);
        throw new Error(result.message || 'Failed to invite user');
      }

      return result;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  async acceptInvitation(invitationId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/accept-invitation/${invitationId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to accept invitation');
      }

      return result.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }
}

export const companyService = new CompanyService();
