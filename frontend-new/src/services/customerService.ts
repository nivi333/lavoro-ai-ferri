import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export interface Customer {
  id: string;
  customerId: string;
  code: string;
  name: string;
  customerType: string;
  companyName?: string;
  customerCategory?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  // Billing Address
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  // Shipping Address
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPostalCode?: string;
  sameAsBillingAddress?: boolean;
  // Financial Information
  paymentTerms?: string;
  creditLimit?: number;
  currency?: string;
  taxId?: string;
  panNumber?: string;
  // Additional Information
  assignedSalesRep?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  customerType?: string;
  companyName?: string;
  customerCategory?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  // Billing Address
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  // Shipping Address
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPostalCode?: string;
  sameAsBillingAddress?: boolean;
  // Financial Information
  paymentTerms?: string;
  creditLimit?: number;
  currency?: string;
  taxId?: string;
  panNumber?: string;
  // Additional Information
  assignedSalesRep?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CustomerFilters {
  search?: string;
  customerType?: string;
  customerCategory?: string;
  isActive?: boolean;
  paymentTerms?: string;
  currency?: string;
  assignedSalesRep?: string;
  page?: number;
  limit?: number;
}

class CustomerService {
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

  private getTenantId() {
    const company = AuthStorage.getCurrentCompany();
    if (!company) {
      throw new Error('No active company selected');
    }
    return company.id;
  }

  async getCustomers(
    filters: CustomerFilters = {}
  ): Promise<{ customers: Customer[]; pagination: any }> {
    try {
      const tenantId = this.getTenantId();
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.customerType) params.append('customerType', filters.customerType);
      if (filters.customerCategory) params.append('customerCategory', filters.customerCategory);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.paymentTerms) params.append('paymentTerms', filters.paymentTerms);
      if (filters.currency) params.append('currency', filters.currency);
      if (filters.assignedSalesRep) params.append('assignedSalesRep', filters.assignedSalesRep);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}/customers?${params}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      return {
        customers: data.data || [],
        pagination: data.pagination || { page: 1, limit: 10, total: 0 },
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer> {
    try {
      const tenantId = this.getTenantId();
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}/customers/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch customer');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const tenantId = this.getTenantId();
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}/customers`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create customer');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    try {
      const tenantId = this.getTenantId();
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}/customers/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update customer');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      const tenantId = this.getTenantId();
      const response = await fetch(`${API_BASE_URL}/companies/${tenantId}/customers/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async checkNameAvailability(name: string): Promise<boolean> {
    try {
      const tenantId = this.getTenantId();
      const response = await fetch(
        `${API_BASE_URL}/companies/${tenantId}/customers/check-name?name=${encodeURIComponent(name)}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        // If API fails, allow the name (backend will validate)
        console.warn('Name check API failed, skipping client-side validation');
        return true;
      }

      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking customer name availability:', error);
      return true; // Allow on error, backend will validate
    }
  }
}

export const customerService = new CustomerService();
