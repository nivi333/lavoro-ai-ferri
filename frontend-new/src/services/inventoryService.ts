import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


// ============================================
// INTERFACES
// ============================================

export interface LocationInventory {
  id: string;
  inventoryCode: string;
  productId: string;
  locationId: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  lastUpdated: string;
  updatedBy: string;
  product: {
    id: string;
    productId: string;
    productCode: string;
    sku: string;
    name: string;
    description?: string;
    unitOfMeasure: string;
    costPrice: number;
    sellingPrice: number;
    imageUrl?: string;
    isActive: boolean;
  };
  location: {
    id: string;
    locationId: string;
    name: string;
    isDefault: boolean;
    isHeadquarters: boolean;
  };
}

export interface StockMovement {
  id: string;
  movementId: string;
  productId: string;
  fromLocationId?: string;
  toLocationId?: string;
  movementType: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  fromLocation?: {
    id: string;
    locationId: string;
    name: string;
  };
  toLocation?: {
    id: string;
    locationId: string;
    name: string;
  };
}

export interface StockReservation {
  id: string;
  reservationId: string;
  productId: string;
  locationId: string;
  orderId?: string;
  reservedQuantity: number;
  reservationType: string;
  status: string;
  expiresAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    productId: string;
    productCode: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
    imageUrl?: string;
  };
  location: {
    id: string;
    locationId: string;
    name: string;
  };
}

export interface StockAlert {
  id: string;
  alertId: string;
  productId: string;
  locationId: string;
  alertType: string;
  currentStock: number;
  thresholdValue: number;
  status: string;
  message: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  product: {
    id: string;
    productId: string;
    productCode: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
    imageUrl?: string;
  };
  location: {
    id: string;
    locationId: string;
    name: string;
  };
}

// Request interfaces
export interface UpdateLocationInventoryRequest {
  productId: string;
  locationId: string;
  stockQuantity: number;
  reservedQuantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

export interface StockMovementRequest {
  productId: string;
  fromLocationId?: string;
  toLocationId?: string;
  movementType: 'PURCHASE' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'PRODUCTION_IN' | 'PRODUCTION_OUT' | 'RETURN_IN' | 'RETURN_OUT' | 'DAMAGE';
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface StockReservationRequest {
  productId: string;
  locationId: string;
  orderId?: string;
  reservedQuantity: number;
  reservationType: 'ORDER' | 'PRODUCTION' | 'TRANSFER' | 'MANUAL';
  expiresAt?: string;
  notes?: string;
}

export interface InventoryFilters {
  locationId?: string;
  productId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  search?: string;
}

// Response interfaces
export interface InventoryListResponse {
  success: boolean;
  data: LocationInventory[];
  message?: string;
}

export interface StockMovementListResponse {
  success: boolean;
  data: StockMovement[];
  message?: string;
}

export interface StockReservationListResponse {
  success: boolean;
  data: StockReservation[];
  message?: string;
}

export interface StockAlertListResponse {
  success: boolean;
  data: StockAlert[];
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================
// INVENTORY SERVICE CLASS
// ============================================

class InventoryService {
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

  // ============================================
  // LOCATION INVENTORY METHODS
  // ============================================

  async getLocationInventory(filters?: InventoryFilters): Promise<InventoryListResponse> {
    const query = new URLSearchParams();

    if (filters?.locationId) query.append('locationId', filters.locationId);
    if (filters?.productId) query.append('productId', filters.productId);
    if (filters?.lowStock) query.append('lowStock', 'true');
    if (filters?.outOfStock) query.append('outOfStock', 'true');
    if (filters?.search) query.append('search', filters.search);

    const url = `${API_BASE_URL}/inventory/locations${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch inventory');
    }

    return {
      success: result.success || true,
      data: result.data || [],
      message: result.message,
    };
  }

  async updateLocationInventory(data: UpdateLocationInventoryRequest): Promise<ApiResponse<LocationInventory>> {
    const response = await fetch(`${API_BASE_URL}/inventory/locations`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update inventory');
    }

    return {
      success: result.success || true,
      data: result.data,
      message: result.message,
    };
  }

  // ============================================
  // STOCK MOVEMENT METHODS
  // ============================================

  async recordStockMovement(data: StockMovementRequest): Promise<ApiResponse<StockMovement>> {
    const response = await fetch(`${API_BASE_URL}/inventory/movements`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to record stock movement');
    }

    return {
      success: result.success || true,
      data: result.data,
      message: result.message,
    };
  }

  async getStockMovements(filters?: { productId?: string; locationId?: string; movementType?: string }): Promise<StockMovementListResponse> {
    const query = new URLSearchParams();

    if (filters?.productId) query.append('productId', filters.productId);
    if (filters?.locationId) query.append('locationId', filters.locationId);
    if (filters?.movementType) query.append('movementType', filters.movementType);

    const url = `${API_BASE_URL}/inventory/movements${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch stock movements');
    }

    return {
      success: result.success || true,
      data: result.data || [],
      message: result.message,
    };
  }

  // ============================================
  // STOCK RESERVATION METHODS
  // ============================================

  async createStockReservation(data: StockReservationRequest): Promise<ApiResponse<StockReservation>> {
    const response = await fetch(`${API_BASE_URL}/inventory/reservations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create stock reservation');
    }

    return {
      success: result.success || true,
      data: result.data,
      message: result.message,
    };
  }

  async releaseStockReservation(reservationId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/inventory/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to release stock reservation');
    }

    return {
      success: result.success || true,
      message: result.message,
    };
  }

  async getStockReservations(filters?: { productId?: string; locationId?: string; status?: string }): Promise<StockReservationListResponse> {
    const query = new URLSearchParams();

    if (filters?.productId) query.append('productId', filters.productId);
    if (filters?.locationId) query.append('locationId', filters.locationId);
    if (filters?.status) query.append('status', filters.status);

    const url = `${API_BASE_URL}/inventory/reservations${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch stock reservations');
    }

    return {
      success: result.success || true,
      data: result.data || [],
      message: result.message,
    };
  }

  // ============================================
  // STOCK ALERT METHODS
  // ============================================

  async getStockAlerts(status?: string): Promise<StockAlertListResponse> {
    const query = new URLSearchParams();

    if (status) query.append('status', status);

    const url = `${API_BASE_URL}/inventory/alerts${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch stock alerts');
    }

    return {
      success: result.success || true,
      data: result.data || [],
      message: result.message,
    };
  }

  async acknowledgeStockAlert(alertId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/inventory/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to acknowledge stock alert');
    }

    return {
      success: result.success || true,
      message: result.message,
    };
  }

  async deleteInventory(inventoryId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/inventory/${inventoryId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete inventory');
    }

    return {
      success: result.success || true,
      message: result.message,
    };
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
