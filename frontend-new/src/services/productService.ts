import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export interface ProductCategory {
  id: string;
  categoryId: string;
  companyId: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  productId: string;
  productCode: string;
  companyId: string;
  categoryId?: string;
  sku: string;
  name: string;
  description?: string;
  productType: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  markupPercent?: number;
  stockQuantity: number;
  reorderLevel?: number;
  barcode?: string;
  imageUrl?: string;
  specifications?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
}

export interface StockAdjustment {
  id: string;
  adjustmentId: string;
  productId: string;
  companyId: string;
  adjustmentType: 'ADD' | 'REMOVE' | 'SET' | 'SALE' | 'PURCHASE' | 'RETURN' | 'DAMAGE' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  notes?: string;
  adjustedBy: string;
  createdAt: string;
}

export interface ProductDetail extends ProductSummary {
  stockAdjustments: StockAdjustment[];
}

export interface CreateProductRequest {
  categoryId?: string;
  productCode?: string;
  sku?: string;
  name: string;
  description?: string;
  productType: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  markupPercent?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  barcode?: string;
  imageUrl?: string;
  specifications?: any;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
  description?: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  unitOfMeasure?: string;
  costPrice?: number;
  sellingPrice?: number;
  markupPercent?: number;
  reorderLevel?: number;
  barcode?: string;
  imageUrl?: string;
  specifications?: any;
  isActive?: boolean;
}

export interface StockAdjustmentRequest {
  adjustmentType: 'ADD' | 'REMOVE' | 'SET' | 'SALE' | 'PURCHASE' | 'RETURN' | 'DAMAGE' | 'TRANSFER';
  quantity: number;
  reason?: string;
  notes?: string;
  adjustedBy: string;
}

export interface ListProductsParams {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  data: ProductSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProductService {
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

  async getProducts(params?: ListProductsParams): Promise<ProductListResponse> {
    const query = new URLSearchParams();

    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.lowStock) query.append('lowStock', 'true');
    if (params?.minPrice) query.append('minPrice', String(params.minPrice));
    if (params?.maxPrice) query.append('maxPrice', String(params.maxPrice));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const url = `${API_BASE_URL}/products${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch products');
    }

    return {
      data: result.data || [],
      pagination: result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  async createProduct(data: CreateProductRequest): Promise<ProductDetail> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create product');
    }

    return result.data as ProductDetail;
  }

  async getProductById(productId: string): Promise<ProductDetail> {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch product');
    }

    return result.data as ProductDetail;
  }

  async updateProduct(productId: string, data: UpdateProductRequest): Promise<ProductDetail> {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update product');
    }

    return result.data as ProductDetail;
  }

  async deleteProduct(productId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete product');
    }
  }

  async adjustStock(
    productId: string,
    data: StockAdjustmentRequest
  ): Promise<{
    product: ProductDetail;
    adjustment: StockAdjustment;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/products/${encodeURIComponent(productId)}/stock-adjustment`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to adjust stock');
    }

    return result.data;
  }

  async getCategories(): Promise<ProductCategory[]> {
    const response = await fetch(`${API_BASE_URL}/products/categories`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch categories');
    }

    return result.data || [];
  }

  async createCategory(name: string, description?: string): Promise<ProductCategory> {
    const response = await fetch(`${API_BASE_URL}/products/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create category');
    }

    return result.data as ProductCategory;
  }

  async checkNameAvailability(name: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/check-name?name=${encodeURIComponent(name)}`,
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
      console.error('Error checking product name availability:', error);
      return true; // Allow on error, backend will validate
    }
  }
}

export const productService = new ProductService();
