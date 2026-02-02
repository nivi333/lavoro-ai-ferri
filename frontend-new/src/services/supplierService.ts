import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { AuthStorage } from '../utils/storage';


export interface Supplier {
  id: string;
  supplierId: string;
  code: string;
  name: string;
  supplierType: string;
  companyRegNo?: string;
  // Contact Info
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  fax?: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  // Financial
  paymentTerms?: string;
  creditPeriod?: number;
  currency: string;
  taxId?: string;
  panNumber?: string;
  bankDetails?: string;
  // Supply Info
  productCategories?: string[];
  leadTimeDays?: number;
  minOrderQty?: number;
  minOrderValue?: number;
  // Quality & Compliance
  qualityRating?: string;
  certifications?: string[];
  complianceStatus?: string;
  // Additional
  supplierCategory?: string;
  assignedManager?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  supplierType?: string;
  companyRegNo?: string;
  // Contact Info
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  fax?: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  // Financial
  paymentTerms?: string;
  creditPeriod?: number;
  currency?: string;
  taxId?: string;
  panNumber?: string;
  bankDetails?: string;
  // Supply Info
  productCategories?: string[];
  leadTimeDays?: number;
  minOrderQty?: number;
  minOrderValue?: number;
  // Quality & Compliance
  qualityRating?: string;
  certifications?: string[];
  complianceStatus?: string;
  // Additional
  supplierCategory?: string;
  assignedManager?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {}

export interface SupplierFilters {
  search?: string;
  supplierType?: string;
  supplierCategory?: string;
  isActive?: boolean;
  qualityRating?: string;
  complianceStatus?: string;
}

class SupplierService {
  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    const token = tokens?.accessToken;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getCompanyId(): string {
    const companyId = localStorage.getItem('currentCompanyId');
    if (!companyId) {
      throw new Error('No company selected');
    }
    return companyId;
  }

  async getSuppliers(filters?: SupplierFilters) {
    try {
      const companyId = this.getCompanyId();
      const params = new URLSearchParams();

      if (filters?.search) params.append('search', filters.search);
      if (filters?.supplierType) params.append('supplierType', filters.supplierType);
      if (filters?.supplierCategory) params.append('supplierCategory', filters.supplierCategory);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.qualityRating) params.append('qualityRating', filters.qualityRating);
      if (filters?.complianceStatus) params.append('complianceStatus', filters.complianceStatus);

      const response = await axios.get(
        `${API_BASE_URL}/companies/${companyId}/suppliers?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        suppliers: response.data.data || response.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error('Supplier service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch suppliers');
    }
  }

  async getSupplierById(supplierId: string): Promise<Supplier> {
    try {
      const companyId = this.getCompanyId();
      const response = await axios.get(
        `${API_BASE_URL}/companies/${companyId}/suppliers/${supplierId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Supplier service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch supplier');
    }
  }

  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    try {
      const companyId = this.getCompanyId();
      const response = await axios.post(`${API_BASE_URL}/companies/${companyId}/suppliers`, data, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Supplier service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create supplier');
    }
  }

  async updateSupplier(supplierId: string, data: UpdateSupplierRequest): Promise<Supplier> {
    try {
      const companyId = this.getCompanyId();
      const response = await axios.put(
        `${API_BASE_URL}/companies/${companyId}/suppliers/${supplierId}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Supplier service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update supplier');
    }
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    try {
      const companyId = this.getCompanyId();
      await axios.delete(`${API_BASE_URL}/companies/${companyId}/suppliers/${supplierId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error: any) {
      console.error('Supplier service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete supplier');
    }
  }

  async checkNameAvailability(name: string): Promise<boolean> {
    try {
      const companyId = this.getCompanyId();
      const response = await axios.get(
        `${API_BASE_URL}/companies/${companyId}/suppliers/check-name?name=${encodeURIComponent(name)}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.available;
    } catch (error: any) {
      console.error('Error checking supplier name availability:', error);
      return true; // Allow on error, backend will validate
    }
  }
}

export const supplierService = new SupplierService();
