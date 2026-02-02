import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export type POStatus =
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type OrderPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export interface PurchaseOrderItemInput {
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  discountPercent?: number;
  taxRate?: number;
  expectedDelivery?: string; // ISO string
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  lineNumber: number;
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineAmount: number;
  expectedDelivery?: string;
  notes?: string;
  product?: {
    id: string;
    product_code: string;
    name: string;
    unit_of_measure: string;
  };
}

export interface PurchaseOrderSummary {
  id: string;
  poId: string;
  companyId: string;
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  status: POStatus;
  priority: OrderPriority;
  poDate: string;
  expectedDeliveryDate?: string;
  currency: string;
  paymentTerms?: string;
  referenceNumber?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharges: number;
  totalAmount: number;
  notes?: string;
  termsConditions?: string;
  locationId?: string;
  deliveryAddress?: string;
  shippingMethod?: string;
  incoterms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface PurchaseOrderDetail extends PurchaseOrderSummary {
  items: PurchaseOrderItem[];
  supplier?: {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
  };
}

export interface CreatePurchaseOrderRequest {
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  priority?: OrderPriority;
  poDate: string; // ISO string
  expectedDeliveryDate?: string; // ISO string
  currency?: string;
  paymentTerms?: string;
  referenceNumber?: string;
  notes?: string;
  termsConditions?: string;
  locationId?: string;
  deliveryAddress?: string;
  shippingMethod?: string;
  incoterms?: string;
  shippingCharges?: number;
  items: PurchaseOrderItemInput[];
}

export interface ListPurchaseOrdersParams {
  status?: POStatus | string;
  priority?: OrderPriority | string;
  supplierId?: string;
  from?: string; // ISO date string (date only is fine)
  to?: string;
  supplierName?: string;
}

class PurchaseOrderService {
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

  async getPurchaseOrders(params?: ListPurchaseOrdersParams): Promise<PurchaseOrderSummary[]> {
    const query = new URLSearchParams();

    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.supplierName) query.append('supplierName', params.supplierName);

    const url = `${API_BASE_URL}/purchase-orders${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch purchase orders');
    }

    return result.data || [];
  }

  async createPurchaseOrder(data: CreatePurchaseOrderRequest): Promise<PurchaseOrderDetail> {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create purchase order');
    }

    return result.data as PurchaseOrderDetail;
  }

  async getPurchaseOrderById(poId: string): Promise<PurchaseOrderDetail> {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${encodeURIComponent(poId)}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch purchase order');
    }

    return result.data as PurchaseOrderDetail;
  }

  async updatePurchaseOrder(poId: string, data: Partial<CreatePurchaseOrderRequest>): Promise<PurchaseOrderDetail> {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${encodeURIComponent(poId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update purchase order');
    }

    return result.data as PurchaseOrderDetail;
  }

  async updatePOStatus(
    poId: string,
    status: POStatus,
    payload?: {
      expectedDeliveryDate?: string;
      shippingMethod?: string;
    },
  ): Promise<PurchaseOrderSummary> {
    const response = await fetch(
      `${API_BASE_URL}/purchase-orders/${encodeURIComponent(poId)}/status`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, ...(payload || {}) }),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update purchase order status');
    }

    return result.data as PurchaseOrderSummary;
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${encodeURIComponent(poId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete purchase order');
    }
  }
}

export const purchaseOrderService = new PurchaseOrderService();
